<div class="container">
    <form id="form">
        <div class="mb-3">
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
            <textarea class="form-control" id="input" rows="3">The Beatles, St. Pepper's Lonely Hearts Club Band
No Doubt, Tragic Kingdom</textarea>
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
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Result</th>
                </tr>
            </thead>
            <tbody id="output-table-body"></tbody>
        </table>
    </div>
</div>

<script>
    const Fetcher = new VgrFetcher();
</script>
