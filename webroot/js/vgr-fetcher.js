class VgrFetcher {

    constructor() {
        this.mbHeaders = new Headers({
            'User-Agent': 'VgrFetcher/1.0.0 ( graham@phantomwatson.com )'
        });
        this.mbidThrottle = 1000;
        this.albumArtThrottle = 500;
        this.form = document.getElementById('form');
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.process();
        });

        this.delimiterSelect = document.getElementById('delimiter');
        this.inputField = document.getElementById('input');

        this.button = document.getElementById('submit');
        this.button.addEventListener('click', (event) => {
            event.preventDefault();
            this.process();
        });

        this.output = document.getElementById('output');
        this.outputTable = document.getElementById('output-table-body');
        this.progress = document.getElementById('progress');

        this.imageCache = {};
        this.mbidCache = {};

        this.inputMode = document.getElementById('input-mode');
        this.inputMode.addEventListener('change', () => {
            this.handleModeChange();
        });
        this.handleModeChange();

        // TODO: Change process button to stop button, revert when done processing
    }

    process() {
        const input = this.inputField.value;
        if (!input) {
            alert('You gotta put some input in first');
            return;
        }

        this.output.dataset.hasOutput = "1";
        this.delimiter = this.delimiterSelect.value;
        this.lines = input.split("\n");
        this.lineCount = this.lines.length;
        this.outputTable.innerHTML = '';
        this.index = 0;
        this.processLine();
    }

    async processLine() {
        const line = this.lines[this.index].trim();
        // TODO: Skip blank lines
        if (!this.isValidLine(line)) {
            this.addInvalidRow(line);
            return;
        }

        const albumProperties = this.getAlbumPropertiesFromLine(line);
        this.addRow(albumProperties.upc, albumProperties.artist, albumProperties.album);

        const mbid = await this.fetchMbid(line);
        if (mbid) {
            const albumArtUrl = await this.fetchAlbumArt(mbid);
            if (albumArtUrl) {
                this.updateResult(`<a href="${albumArtUrl}" target="_blank"><img src="${albumArtUrl}" /></a>`)
            } else {
                this.updateResult('Album art not found');
            }
        } else {
            this.updateResult('Album not found');
        }
        this.setProgress(this.index + 1);

        if (!this.isDone()) {
            this.index++;
            this.processLine();
        }
    }

    isDone() {
        return this.index + 1 === this.lineCount;
    }

    setProgress(current) {
        let percentDone = (current >= this.lineCount) ? 100 : Math.round((current / this.lineCount) * 100);
        percentDone = `${percentDone}%`;
        this.progress.style.width = percentDone;
        this.progress.innerHTML = percentDone;
    }

    addRow(upc, artist, album) {
        let row = '<tr>';
        switch (this.inputMode.value) {
            case 'artist-album':
                row += `<td></td><td>${artist}</td><td>${album}</td>`;
                break;
            case 'upc':
                row += `<td>${upc}</td><td id="artist-${this.index}">${this.fetching()}</td><td id="album-${this.index}">${this.fetching()}</td>`;
                break;
            default:
                row += `<td></td><td></td><td></td>`;
                this.alertUnknownInputMode();
        }
        row += `<td id="result-${this.index}">${this.fetching()}</td></tr>`;

        this.outputTable.innerHTML += row;
    }

    fetching() {
        return '<i class="fa-solid fa-cog fa-spin"></i> Fetching...';
    }

    updateResult(result) {
        const resultContainer = document.getElementById('result-' + this.index);
        resultContainer.innerHTML = result;
    }

    addInvalidRow(line) {
        this.outputTable.innerHTML += `<tr class="table-danger"><td colspan="4">Invalid: ${line}</td></tr>`;
    }

    async fetchMbid(line) {
        if (this.mbidCache.hasOwnProperty(line)) {
            return this.mbidCache[line];
        }

        let url = 'http://musicbrainz.org/ws/2/release/?query=' + this.getSearchQueryString(line) + '&limit=10&fmt=json';
        let mbid;
        try {
            await (async () => {
                await this.sleep(this.mbidThrottle);
                const init = {
                    headers: this.mbHeaders
                };
                const response = await fetch(url, init);
                const data = await response.json();
                console.log(data);
                mbid = data.releases[0].id ?? null;
                this.mbidCache[line] = mbid;
                if (this.inputMode.value === 'upc') {
                    this.updateArtistAndAlbum(data);
                }
            })();
            return mbid;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    updateArtistAndAlbum(data) {
        const artistResults = data.releases[0]['artist-credit'] ?? [];
        const artistsArray = [];
        artistResults.forEach((artistObj) => {
            artistsArray.push(artistObj.name);
        })
        const notFound = '<span class="alert alert-warning">Not found</span>';
        const artist = artistsArray.length ? artistsArray.join(', ') : notFound;
        const album = data.releases[0].title ?? notFound;
        document.getElementById('artist-' + this.index).innerHTML = artist;
        document.getElementById('album-' + this.index).innerHTML = album;
    }

    parseAlbumArtResponseCode(code) {
        switch (code) {
            case 307:
                return 'success';
            case 400:
                return 'Release ID cannot be parsed as a valid UUID.';
            case 404:
                return 'There is no release with this MBID.';
            case 405:
                return 'The request method is not one of GET or HEAD.';
            case 406:
                return 'The server is unable to generate a response suitable to the Accept header.';
            case 503:
                return 'The user has exceeded their rate limit.';
        }

        return 'Unknown response code: ' + code;
    }

    async fetchAlbumArt(mbid) {
        if (this.imageCache.hasOwnProperty(mbid)) {
            return this.imageCache[mbid];
        }

        let url = `http://coverartarchive.org/release/${mbid}`;
        let imageUrl;
        try {
            await (async () => {
                await this.sleep(this.albumArtThrottle);
                const response = await fetch(url);
                if (!response.ok) {
                    const errorMsg = this.parseAlbumArtResponseCode(response.status);
                    this.updateResult(errorMsg);
                    return;
                }
                const data = await response.json();
                imageUrl = data.images[0].image;
                this.imageCache[mbid] = imageUrl;
            })();
            return imageUrl;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    handleModeChange() {
        const inputsArtistAlbum = document.getElementById('inputs-artist-album');
        const inputsUpc = document.getElementById('inputs-upc');
        switch (this.inputMode.value) {
            case 'artist-album':
                inputsArtistAlbum.style.display = 'block';
                inputsUpc.style.display = 'none';
                break;
            case 'upc':
                inputsArtistAlbum.style.display = 'none';
                inputsUpc.style.display = 'block';
                break;
            default:
                this.alertUnknownInputMode();
        }
    }

    alertUnknownInputMode() {
        alert('Unknown input mode: ' + this.inputMode.value);
    }

    getAlbumPropertiesFromLine(line) {
        const splitLine = line.split(this.delimiter);
        const retval = {
            artist: '',
            album: '',
            upc: '',
        };
        switch (this.inputMode.value) {
            case 'artist-album':
                retval.artist = splitLine[0];
                retval.album = splitLine[1];
                break;
            case 'upc':
                retval.upc = splitLine[0];
                break;
            default:
                this.alertUnknownInputMode();
        }

        return retval;
    }

    getSearchQueryString(line) {
        const albumProperties = this.getAlbumPropertiesFromLine(line);
        let queryParts = [];
        switch (this.inputMode.value) {
            case 'upc':
                queryParts.push(`barcode:${albumProperties.upc}`);
                break;
            case 'artist-album':
                queryParts.push(`artist:${albumProperties.artist}`);
                queryParts.push(`release:${albumProperties.album}`);
                break;
        }

        return encodeURIComponent(queryParts.join(' AND '));
    }

    isValidLine(line) {
        switch (this.inputMode.value) {
            case 'artist-album':
                return line.split(this.delimiter).length === 2;
            case 'upc':
                return line !== '';
        }
        this.alertUnknownInputMode();
        return false;
    }
}
