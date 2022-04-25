class VgrFetcher {
    constructor() {
        this.mbHeaders = new Headers({
            'User-Agent': 'VgrFetcher/1.0.0 ( graham@phantomwatson.com )'
        });
        this.mbidThrottle = 1000;
        this.albumArtThrottle = 500;
        this.resultLimit = 10;
        this.form = document.getElementById('form');
        this.form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.process();
        });

        this.delimiterSelect = document.getElementById('delimiter');
        this.inputField = document.getElementById('input');

        this.button = document.getElementById('submit');
        this.button.addEventListener('click', async (event) => {
            event.preventDefault();
            await this.process();
        });

        this.output = document.getElementById('output');
        this.outputTable = document.getElementById('output-table-body');
        this.progress = document.getElementById('progress');

        this.imageCache = {};
        this.releaseCache = {};

        this.inputMode = document.getElementById('input-mode');
        this.inputMode.addEventListener('change', () => {
            this.handleModeChange();
        });
        this.handleModeChange();

        // TODO: Clear table if this isn't the first time input has been processed
        // TODO: Change process button to a stop button
        // TODO: Skip blank lines
    }

    async process() {
        const input = this.inputField.value;
        if (!input) {
            alert('You gotta put some input in first');
            return;
        }

        this.button.disabled = true;
        this.button.innerHTML = 'Processing...';
        this.output.dataset.hasOutput = "1";
        this.delimiter = this.delimiterSelect.value;
        this.lines = input.split("\n");
        this.lineCount = this.lines.length;
        this.outputTable.innerHTML = '';
        this.index = 0;
        await this.processLine(this.index);
    }

    /**
     * @returns {Promise<void>}
     */
    async processLine(index) {
        const line = this.lines[index].trim();

        if (!this.isValidLine(line)) {
            this.addInvalidRow(line);
            return;
        }

        const albumProperties = this.getAlbumPropertiesFromLine(line);
        this.addRow(albumProperties.upc, albumProperties.artist, albumProperties.album);
        const releases = await this.fetchReleases(line);
        await this.fetchAndAddImages(releases, index);
        this.setProgress(index + 1);

        if (this.isDone()) {
            this.finalize();
            return;
        }

        this.index++;
        await this.processLine(this.index);
    }

    /**
     * Wraps up execution
     */
    finalize() {
        this.button.disabled = false;
        this.button.innerHTML = 'Process';
    }

    /**
     * @returns {HTMLElement}
     */
    getArtContainer() {
        return document.getElementById('result-' + this.index);
    }

    /**
     * @returns {boolean}
     */
    isDone() {
        return this.index + 1 === this.lineCount;
    }

    /**
     * @param {number} current
     */
    setProgress(current) {
        let percentDone = (current >= this.lineCount) ? 100 : Math.round((current / this.lineCount) * 100);
        percentDone = `${percentDone}%`;
        this.progress.style.width = percentDone;
        this.progress.innerHTML = percentDone;
    }

    /**
     * @param {string} upc
     * @param {string} artist
     * @param {string} album
     */
    addRow(upc, artist, album) {
        let row = '<tr>';
        switch (this.inputMode.value) {
            case 'artist-album':
                row += '<td></td>';
                row += `<td>${artist}</td>`;
                row += `<td>${album}</td>`;
                break;
            case 'upc':
                row += `<td>${upc}</td>`;
                row += `<td id="artist-${this.index}">${this.fetching()}</td>`;
                row += `<td id="album-${this.index}">${this.fetching()}</td>`;
                break;
            default:
                row += `<td></td><td></td><td></td>`;
                this.alertUnknownInputMode();
        }
        row += `<td id="release-count-${this.index}"><i class="fa-solid fa-cog fa-spin"></i></td>`;
        row += `<td id="result-${this.index}">${this.fetching()}</td></tr>`;

        this.outputTable.innerHTML += row;
    }

    /**
     * String for "fetching..." indicator
     *
     * @returns {string}
     */
    fetching() {
        return '<i class="fa-solid fa-cog fa-spin"></i> Fetching...';
    }

    /**
     * @param {string} result HTML to add to cell
     * @param {number} index
     */
    addToImageCell(result, index) {
        const artContainer = document.getElementById('result-' + index);
        if (artContainer.innerHTML.trim() === this.fetching()) {
            artContainer.innerHTML = result;
        } else {
            artContainer.innerHTML += result;
        }
    }

    /**
     * @param {string} line
     */
    addInvalidRow(line) {
        this.outputTable.innerHTML += `<tr class="table-danger"><td colspan="4">Invalid: ${line}</td></tr>`;
    }

    /**
     * @param line
     * @returns {Promise<boolean|*[]|*>}
     */
    async fetchReleases(line) {
        if (this.releaseCache.hasOwnProperty(line)) {
            return this.releaseCache[line];
        }

        let queryString = this.getSearchQueryString(line);
        let url = `http://musicbrainz.org/ws/2/release/?query=${queryString}&limit=${this.resultLimit}&fmt=json`;
        let releases = [];
        try {
            await (async () => {
                await this.sleep(this.mbidThrottle);
                const init = {
                    headers: this.mbHeaders
                };
                const response = await fetch(url, init);
                const data = await response.json();
                console.log(data);
                data.releases.forEach((release) => {
                    releases.push(this.parseReleaseData(release));
                });
                this.releaseCache[line] = releases;
                if (this.inputMode.value === 'upc') {
                    this.updateArtistAlbumReleaseCount(releases);
                }
            })();
            return releases;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * @param release
     * @returns {{mbid: null, artist: (string|string), album: (string|string|*|string)}}
     */
    parseReleaseData(release) {
        const artistResults = (release && release.hasOwnProperty('artist-credit')) ? release['artist-credit'] : [];
        const artistsArray = [];
        artistResults.forEach((artistObj) => {
            artistsArray.push(artistObj.name);
        })
        const artist = artistsArray.length ? artistsArray.join(', ') : this.notFound();
        const album = (release && release.hasOwnProperty('title')) ? release.title : this.notFound();
        return {
            mbid: release.id ?? null,
            artist: artist,
            album: album,
        };
    }

    /**
     * @param {Array} releases
     */
    updateArtistAlbumReleaseCount(releases) {
        const artistCell = document.getElementById('artist-' + this.index);
        const albumCell = document.getElementById('album-' + this.index);
        const countCell = document.getElementById('release-count-' + this.index);
        if (releases.length === 0) {
            artistCell.innerHTML = this.notFound();
            albumCell.innerHTML = this.notFound();
            countCell.innerHTML = '0';
            return;
        }

        const artists = [];
        const albums = [];
        releases.forEach((release) => {
            artists.push(release.artist);
            albums.push(release.album);
        });
        artistCell.innerHTML = artists.join('<br />');
        albumCell.innerHTML = albums.join('<br />');
        countCell.innerHTML = String(releases.length);
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    notFound(text = 'Not found') {
        return `<span class="alert alert-warning">${text}</span>`;
    }

    /**
     * @param {number} code
     * @returns {string}
     */
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

    /**
     * @param {Array} releases
     * @param {number} index
     * @returns {Promise<void>}
     */
    async fetchAndAddImages(releases, index) {
        if (releases.length === 0) {
            this.addToImageCell('', index);
            return;
        }

        let artFound = false;
        releases.forEach((release) => {
            // Populate art cell from cache
            if (this.imageCache.hasOwnProperty(release.mbid)) {
                const images = this.imageCache[release.mbid];
                this.addImages(images, index);
                return;
            }

            // Fetch art and populate art cell
            (async () => {
                await this.sleep(this.albumArtThrottle);
                let data;
                try {
                    let url = `http://coverartarchive.org/release/${release.mbid}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        const errorMsg = this.parseAlbumArtResponseCode(response.status);
                        this.addToImageCell(errorMsg, index);
                        return;
                    }
                    data = await response.json();
                } catch (error) {
                    console.error(error);
                }
                console.log(data);
                const images = data.images.map(image => image.image);
                this.addImages(images, index);
                this.imageCache[release.mbid] = images;
                if (images.length) {
                    artFound = true;
                }
            })();
        });

        if (!artFound) {
            //TODO: Fix weird async problem where this code is executed before above loop finishes
            //this.addToImageCell(this.notFound('Album art not found'), index);
        }
    }

    /**
     * Puts provided image files into table cell
     *
     * @param {Array.<string>} images
     * @param {number} index
     */
    addImages(images, index) {
        images.forEach((image) => {
            this.addToImageCell(`<a href="${image}" target="_blank"><img src="${image}" /></a>`, index);
        });
    }

    /**
     * @param {number} milliseconds
     * @returns {Promise<unknown>}
     */
    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Handles artist/album vs. UPC mode change
     */
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

    /**
     * Throws alert if a coding error resulted in an unknown input mode
     */
    alertUnknownInputMode() {
        alert('Unknown input mode: ' + this.inputMode.value);
    }

    /**
     * @param {string} line
     * @returns {{artist: string, album: string, upc: string}}
     */
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

    /**
     * @param {string} line
     * @returns {string}
     */
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

    /**
     * @param {string} line Line from input box
     * @returns {boolean}
     */
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
