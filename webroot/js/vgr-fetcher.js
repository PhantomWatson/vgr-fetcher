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
        const splitLine = line.split(this.delimiter);
        const isValid = splitLine.length === 2;
        if (!isValid) {
            this.addInvalidRow(line);
            return;
        }

        this.setProgress(this.index + 1);
        const artist = splitLine[0];
        const album = splitLine[1];
        this.addRow(artist, album);

        console.log(line);
        const mbid = await this.fetchMbid(line);
        console.log(mbid);
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

        if (!this.isDone()) {
            this.index++;
            this.processLine();
        }
    }

    isDone() {
        return this.index + 1 === this.lineCount;
    }

    setProgress(current) {
        let percentDone = Math.round((current / this.lineCount) * 100);
        percentDone = `${percentDone}%`;
        this.progress.style.width = percentDone;
        this.progress.innerHTML = percentDone;
    }

    addRow(artist, album) {
        this.outputTable.innerHTML += `<tr><td>${artist}</td><td>${album}</td><td id="result-${this.index}"><i class="fa-solid fa-cog fa-spin"></i> Fetching...</td></tr>`;
    }

    updateResult(result) {
        const resultContainer = document.getElementById('result-' + this.index);
        resultContainer.innerHTML = result;
    }

    addInvalidRow(line) {
        this.outputTable.innerHTML += `<tr class="table-danger"><td colspan="3">Invalid: ${line}</td></tr>`;
    }

    async fetchMbid(line) {
        if (this.mbidCache.hasOwnProperty(line)) {
            console.log('album found in cache');
            return this.mbidCache[line];
        }

        const splitLine = line.split(this.delimiter);
        const artist = splitLine[0];
        const album = splitLine[1];
        let url = 'http://musicbrainz.org/ws/2/release/?';
        const query = `artist:${artist} AND release:${album}`;
        url += 'query=' + encodeURIComponent(query);
        url += '&limit=10&fmt=json';
        let mbid;
        try {
            await (async () => {
                await this.sleep(this.mbidThrottle);
                const init = {
                    headers: this.mbHeaders
                };
                const response = await fetch(url, init);
                const data = await response.json();
                mbid = data.releases[0].id;
                this.mbidCache[line] = mbid;
            })();
            return mbid;
        } catch (error) {
            console.error(error);
            return false;
        }
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
            console.log('image found in cache');
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
            console.log(error);
            return false;
        }
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

}
