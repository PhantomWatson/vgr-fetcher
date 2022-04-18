class VgrFetcher {

    constructor() {
        this.throttle = 1000;
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

    processLine() {
        const line = this.lines[this.index].trim();
        const splitLine = line.split(this.delimiter);
        const isValid = splitLine.length === 2;
        if (!isValid) {
            this.addInvalidRow(line);
            return;
        }
        setTimeout(() => {
            this.setProgress(this.index + 1);
            this.addRow(splitLine[0], splitLine[1], '...');
            if (!this.isDone()) {
                this.index++;
                this.processLine();
            }
        }, this.throttle);
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

    addRow(artist, album, result) {
        this.outputTable.innerHTML += `<tr><td>${artist}</td><td>${album}</td><td>${result}</td></tr>`;
    }

    addInvalidRow(line) {
        this.outputTable.innerHTML += `<tr class="table-danger"><td colspan="3">Invalid: ${line}</td></tr>`;
    }
}
