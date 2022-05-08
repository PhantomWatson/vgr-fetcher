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
            await this.toggleProcessing();
        });

        this.delimiterSelect = document.getElementById('delimiter');
        this.inputField = document.getElementById('input');

        this.isProcessing = false;
        this.button = document.getElementById('submit');
        this.button.addEventListener('click', async (event) => {
            event.preventDefault();
            await this.toggleProcessing();
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

        // TODO: Check status code for each image URL and ignore non-2XX images
        // TODO: Hide UPC column when not in UPC mode
        // TODO: Use image thumbnails
    }

    async toggleProcessing() {
        this.isProcessing = !this.isProcessing;

        if (!this.isProcessing) {
            this.button.innerHTML = 'Process';
            this.button.classList.add('btn-primary');
            this.button.classList.remove('btn-danger');
            return;
        }

        const input = this.inputField.value;
        if (!input) {
            alert('You gotta put some input in first');
            return;
        }

        this.button.innerHTML = 'Stop';
        this.button.classList.remove('btn-primary');
        this.button.classList.add('btn-danger');
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
        if (!this.isProcessing) {
            return;
        }

        const line = this.lines[index].trim();

        if (line === '') {
            this.index++;
            await this.processLine(this.index);
            return;
        }

        if (!this.isValidLine(line)) {
            this.addInvalidRow(line);
            this.index++;
            await this.processLine(this.index);
            return;
        }

        const albumProperties = this.getAlbumPropertiesFromLine(line);
        this.addRow(albumProperties.upc, albumProperties.artist, albumProperties.album);
        const releases = await this.fetchReleases(line);
        //const groupedImages = await this.getGroupedImages(releases);
        //this.updateWithGroupedImages(groupedImages, index);
        this.getGroupedImages(releases)
            .then((groupedImages) => this.updateWithGroupedImages(groupedImages, index));
        this.setProgress(index + 1);

        if (this.isDone()) {
            this.finalize();
            return;
        }

        this.index++;
        await this.processLine(this.index);
    }

    /**
     * @param {Object} groupedImages
     * @param {number} index
     */
    updateWithGroupedImages(groupedImages, index) {
        const select = document.createElement('select');
        const artContainer = this.getArtContainer(index);
        artContainer.innerHTML = '';
        let div, img, option;
        groupedImages.forEach((group) => {
            const medium = group.medium;
            const images = group.images;

            // Add options to selector
            option = document.createElement('option');
            option.value = medium;
            option.innerHTML = `${medium} (${images.length})`;
            select.appendChild(option);

            // Add images
            div = document.createElement('div');
            div.dataset.medium = medium;
            images.forEach((image) => {
                img = document.createElement('a');
                img.href = image;
                img.target = '_blank';
                img.innerHTML = `<img src="${image}" />`;
                div.appendChild(img)
            });
            artContainer.appendChild(div);
        });

        // Add selector
        const selectorContainer = document.getElementById('media-' + index);
        selectorContainer.innerHTML = '';
        if (select.childElementCount) {
            selectorContainer.appendChild(select);
        } else {
            this.getArtContainer(index).innerHTML = this.notFound();
        }

        // Select first group
        const firstMedium = select.querySelector('option:checked');
        if (firstMedium) {
            this.selectMedium(firstMedium.value, index);
        }
    }

    selectMedium(medium, index) {
        const container = this.getArtContainer(index);
        const mediumSafe = medium.replace(/["\\]/g, '\\$&');
        const toShow = container.querySelector(`div[data-medium="${mediumSafe}"]`);
        toShow.style.display = 'block';
        const toHide = container.querySelectorAll(`div:not([data-medium="${mediumSafe}"])`);
        toHide.forEach((element) => {
            element.style.display = 'none';
        });
    }

    async getGroupedImages(releases) {
        const groupedImages = [];
        for (const release of releases) {
            await this.sleep(this.albumArtThrottle);
            let imgUrl;
            try {
                let url = `http://coverartarchive.org/release/${release.mbid}/front`;
                const response = await fetch(url);
                if (!response.ok) {
                    const errorMsg = this.parseAlbumArtResponseCode(response.status);
                    console.log(`Error response returned when fetching art for release ${release.mbid}: ${errorMsg}`);
                    continue;
                }
                imgUrl = response?.url;
            } catch (error) {
                console.error(error);
            }
            if (!await this.checkImageUrl(imgUrl)) {
                console.log('Broken link: ' + imgUrl);
                continue;
            }
            let index = groupedImages.findIndex(group => group.medium === release.medium);
            const group = (index === -1) ? {medium: release.medium, images: []} : groupedImages[index];
            group.images.push(imgUrl);
            if (index === -1) {
                groupedImages.push(group);
            } else {
                groupedImages[index] = group;
            }
        }

        return groupedImages;
    }

    /**
     * @param {string} url
     * @returns {Promise<boolean>}
     */
    async checkImageUrl(url) {
        try {
            const response = await fetch(url);
            return response.ok;
        } catch (err) {
            console.log(err);
        }
        return false;
    }

    /**
     * Wraps up execution
     */
    finalize() {
        this.button.innerHTML = 'Process';
        this.addSelectHandlers();
    }

    /**
     * For some reason, it's unreliable to add these onChange handlers right after the <select> elements are created.
     * Some would have working handlers, some wouldn't. But adding all handlers in finalize() works.
     */
    addSelectHandlers() {
        document.querySelectorAll('#output tbody tr').forEach((row) => {
            const index = row.rowIndex - 1;
            const select = row.querySelector('select');
            if (!select) {
                return;
            }
            select.addEventListener('change', (event) => {
                console.log('late change handler triggered for index ' + index);
                const medium = event.target.value;
                this.selectMedium(medium, index);
            });
        });
    }

    /**
     * @returns {HTMLElement}
     */
    getArtContainer(index) {
        return document.getElementById('result-' + index);
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
        row += `<td id="media-${this.index}"><i class="fa-solid fa-cog fa-spin"></i></td>`;
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
        const releases = this.releaseCache.hasOwnProperty(line)
            ? this.releaseCache[line]
            : await this.fetchReleasesFromApi(line);

        if (this.inputMode.value === 'upc') {
            this.updateArtistAndAlbum(releases);
        }

        if (releases.length > 0) {
            this.releaseCache[line] = releases;
        }

        return releases;
    }

    /**
     * @returns {Promise<*[]|*>}
     */
    async fetchReleasesFromApi(line) {
        let releases = [];
        let queryString = this.getSearchQueryString(line);
        let url = `http://musicbrainz.org/ws/2/release/?query=${queryString}&limit=${this.resultLimit}&fmt=json`;
        try {
            await (async () => {
                await this.sleep(this.mbidThrottle);
                const init = {
                    headers: this.mbHeaders
                };
                const response = await fetch(url, init);
                const data = await response.json();
                //console.log('Fetched release data: ', data);
                data.releases.forEach((release) => {
                    releases.push(this.parseReleaseData(release));
                });
            })();
        } catch (error) {
            console.error(error);
        }
        return releases;
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
        const media = release?.media;
        let medium = media ? media[0]?.format : null;
        if (!medium) {
            medium = 'Unknown Format';
            //console.log('Unknown format for this release: ', release);
        }
        return {
            mbid: release.id ?? null,
            artist: artist,
            album: album,
            medium: medium,
        };
    }

    /**
     * @param {Array} releases
     */
    updateArtistAndAlbum(releases) {
        const artistCell = document.getElementById('artist-' + this.index);
        const albumCell = document.getElementById('album-' + this.index);
        if (releases.length === 0) {
            artistCell.innerHTML = this.notFound();
            albumCell.innerHTML = this.notFound();
            return;
        }

        let artists = [];
        let albums = [];
        releases.forEach((release) => {
            artists.push(release.artist);
            albums.push(release.album);
        });
        const indexOfI = (arr, q) => arr.findIndex(item => q.toLowerCase() === item.toLowerCase());
        const unique = (value, index, self) => {
            return indexOfI(self, value) === index;
        }
        artists = artists.filter(unique);
        albums = albums.filter(unique);
        artistCell.innerHTML = artists.join('<br />');
        albumCell.innerHTML = albums.join('<br />');
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
