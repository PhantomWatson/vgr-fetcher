<div class="container">
    <form id="form">
        <div class="mb-3">
            <label for="input-mode">
                Input mode
            </label>
            <select id="input-mode">
                <option value="artist-album">
                    Artist / Album title
                </option>
                <option value="upc">
                    UPC
                </option>
            </select>
        </div>
        <div class="mb-3">
            <div id="inputs-artist-album">
                <label for="input" class="form-label">
                    Artist Name
                    <select id="delimiter">
                        <option value=",">
                            ,
                        </option>
                        <option value=" - ">
                            -
                        </option>
                        <option value="	">
                            (tab)
                        </option>
                    </select>
                    Album Name
                </label>
            </div>
            <div id="inputs-upc">
                <label for="input" class="form-label">
                    UPC
                </label>
            </div>
            <textarea class="form-control" id="input" rows="3"></textarea>
            <p class="footnote">
                One album per line, e.g. <strong>The Beatles, Yellow Submarine</strong>
            </p>
        </div>
        <div class="mb-3">
            <button type="submit" class="btn btn-primary" id="submit">
                Process
            </button>
        </div>
    </form>
    <div class="mb-3" id="output" data-has-output="0">
        <h1>
            Results
        </h1>
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0;" id="progress"></div>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th>UPC</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Releases Found</th>
                    <th>Art</th>
                </tr>
            </thead>
            <tbody id="output-table-body"></tbody>
        </table>
    </div>
</div>

<script>
    const Fetcher = new VgrFetcher();
</script>
