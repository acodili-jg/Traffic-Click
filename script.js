const buttonLabels = [
    "Motorcycle / Motor-bicycle",
    "Motorrela / Motor-tricycle",
    "Passenger car",
    "Taxi",
    "Van",
    "Jeep",
    "Passenger and goods utility and small bus",
    "Rigid truck, 2 axles",
    "Large bus",
    "Rigid truck, 3+ axles",
    "Truck semi-trailer, 3 and 4 axles",
    "Truck semi-trailer, 5+ axles",
    "Truck trailers, 4 axles",
    "Truck Trailers, 5+ axles"
];

// References
const panel = document.getElementById("panel");
const importButton = document.getElementById("navImport");
const clearButton = document.getElementById("navClear");
const exportButton = document.getElementById("navExport");

// Main Code Execution
function inquireCounts() {
    const params = new URL(document.location.toString()).searchParams;
    const state = params.has("state")
        ? params.get("state").split("--").map(entry => entry.split("-").map((s) => parseInt(s)))
        : [];
    return mapCounts(state);
}

function mapCounts(state) {
    let counts = {};

    buttonLabels.forEach((label, index) => {
        if (index < state.length) {
            const entry = state[index];
            if (!isNaN(entry[0]) && !isNaN(entry[1])) {
                counts[label] = entry;
                return;
            }
        }
        counts[label] = [0, 0];
    });

    return counts;
}

let countHere = inquireCounts();

// Create buttons dynamically with grid auto-fit
function renderButtons() {
    // Clear previous changes
    panel.innerHTML = "";

    buttonLabels.forEach(label => {
        const header = document.createElement("h3");
        header.textContent = label;
        panel.appendChild(header);

        [
            [ ["minus", "red", -1], ["plus", "green", +1] ],
            [ ["plus", "blue", +1], ["minus", "red", -1] ],
        ].forEach((layout, direction) => {
            const container = document.createElement("div");

            const buttons = layout.map(([buttonClass, buttonColor, increment]) => {
                const theButton = document.createElement("button");
                theButton.classList.add(buttonClass);
                theButton.classList.add(buttonColor);

                container.appendChild(theButton);

                return [buttonClass, [theButton, increment]];
            });
            const { plus: [plusButton] } = Object.fromEntries(buttons);
            plusButton.textContent = countHere[label][direction];

            buttons.forEach(([_, [theButton, increment]]) => {

                theButton.addEventListener("click", () => {
                    var count = countHere[label][direction] =
                        Math.max(0, countHere[label][direction] + increment);

                    plusButton.textContent = `${count}`;

                    const url = new URL(document.location.toString());
                    url.searchParams.set(
                        "state",
                        buttonLabels
                            .map(label => countHere[label])
                            .map(entry => entry.join("-"))
                            .join("--")
                    );
                    window.history.replaceState(countHere, null, url);
                });
            });

            panel.appendChild(container);
        });
    });
}

renderButtons();

clearButton.addEventListener("click", () => {
    const url = new URL(document.location.toString());
    url.searchParams.delete("state");
    window.location.href = url;
});

window.onbeforeunload = function (e) {
    e = e || window.event;

    const message = "Count progress may be lost forever. Proceed?";

    // For IE and Firefox prior to version 4
    if (e) {
        e.returnValue = 'Sure?';
    }

    // For Safari
    return 'Sure?';
};

importButton.addEventListener("change", () => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.trim().split("\n").slice(1);

        lines.forEach(line => {
            const [label, first, second] = line.split("\t");
            const [d, o] = [parseInt(first), parseInt(second)];
            if (!isNaN(d) && !isNaN(o)) {
                countHere[label] = [d, o];
            }
        });

        const url = new URL(document.location.toString());
        url.searchParams.set(
            "state",
            buttonLabels
                .map(label => countHere[label])
                .map(entry => entry.join("-"))
                .join("--")
        );
        window.location.href = url;
    };
    reader.readAsText(file);
})

exportButton.addEventListener("click", () => {
    let tsv = "Category\tDirection of Analysis\tOpposing Direction\n";
    buttonLabels.forEach(label => {
        tsv += `${label}\t${countHere[label].join("\t")}\n`
    });

    const blob = new Blob([tsv], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle_counts.tsv";
    a.click();
    URL.revokeObjectURL(url);
})
