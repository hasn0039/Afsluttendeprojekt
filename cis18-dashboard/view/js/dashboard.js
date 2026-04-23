// ========== GLOBALE VARIABLER ==========
let descriptions = {};  // Gemmer uddybelser til controls fra JSON fil

// ========== INDLÆS BESKRIVELSER ==========
async function loadDescriptions() {
    try {
        const res = await fetch("/cis18_descriptions.json");
        descriptions = await res.json();
    } catch (err) {
        console.error("Kunne ikke hente beskrivelser:", err);
    }
}

// ========== STARTER NÅR HTML ER LOADED ==========
window.addEventListener("DOMContentLoaded", async () => {
    await loadDescriptions();          // Først: indlæs beskrivelser
    await fetchAndRenderControls();    // Dernæst: hent og vis controls
});

// ========== HENT DATA OG TEGN UI ==========
async function fetchAndRenderControls() {
    const root = document.getElementById("root");
    
    // Vis loading animation
    root.innerHTML = "<div class='text-center text-gray-600 animate-pulse'>Loading dashboard...</div>";

    // Hent alle controls fra API
    const response = await fetch("/api/controls");
    const controls = await response.json();
    
    // Hent brugerdata fra session
    fetch("/api/session")
        .then(res => res.json())
        .then(data => {
            document.getElementById("user-name").innerText = `Welcome, ${data.name}`;
        })
        .catch(() => {
            document.getElementById("user-name").innerText = "Not logged in";
        });

    root.innerHTML = "";  // Tøm loading state

    // ========== TEMA TOGGLE (DARK MODE) ==========
    const themeToggle = document.createElement("button");
    themeToggle.className = "fixed bottom-4 right-4 w-14 h-8 rounded-full bg-gray-300 dark:bg-gray-600 p-1 transition-colors duration-300 z-50";
    themeToggle.setAttribute("aria-label", "Toggle dark mode");

    const toggleCircle = document.createElement("div");
    toggleCircle.className = "w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transform transition-all duration-300";

    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#facc15">...</svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">...</svg>`;

    // Sæt initial icon baseret på gemte tema
    toggleCircle.innerHTML = localStorage.getItem("theme") === "dark" ? moonIcon : sunIcon;
    themeToggle.appendChild(toggleCircle);

    // Set initial position
    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark");
        toggleCircle.classList.add("translate-x-6");
    }

    // Toggle dark mode når der klikkes
    themeToggle.addEventListener("click", () => {
        const html = document.documentElement;
        const isDark = html.classList.toggle("dark");  // Toggle class
        localStorage.setItem("theme", isDark ? "dark" : "light");  // Husk valget
        
        // Animér knappen
        toggleCircle.classList.toggle("translate-x-6");
        toggleCircle.innerHTML = isDark ? moonIcon : sunIcon;
    });

    document.body.appendChild(themeToggle);

    // ========== SCORE VISUALISERING (DONUT CHARTS) ==========
    const allSubControls = controls.flatMap(c => c.subControls);
    const scores = { IG1: [], IG2: [], IG3: [], all: [] };

    // Sortér scores efter Implementation Group
    allSubControls.forEach(sc => {
        if (typeof sc.fulfillment === "number") {
            const group = (sc.implementationGroup || "").trim().toUpperCase();
            if (group.includes("1")) scores.IG1.push(sc.fulfillment);
            else if (group.includes("2")) scores.IG2.push(sc.fulfillment);
            else if (group.includes("3")) scores.IG3.push(sc.fulfillment);
            scores.all.push(sc.fulfillment);
        }
    });

    // Beregn gennemsnit
    function average(arr) {
        return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    }

    const avgIG1 = average(scores.IG1);
    const avgIG2 = average(scores.IG2);
    const avgIG3 = average(scores.IG3);
    const avgAll = average(scores.all);

    // Tegn donut charts
    function createDonut(score, label, colorClass, size = "w-28 h-28", textSize = "text-lg") {
        const percentage = score / 100;
        const dashArray = 100;
        const dashOffset = dashArray * (1 - percentage);
        return `
        <div class="text-center">
            <svg class="${size}" viewBox="0 0 36 36">
                <!-- Grå baggrund cirkel -->
                <path class="text-gray-200 dark:text-gray-700" stroke="currentColor" stroke-width="4" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <!-- Farvet fremad cirkel (animated) -->
                <path class="text-${colorClass}-500" stroke="currentColor" stroke-width="4" 
                    stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" stroke-linecap="round"
                    fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <!-- Procent tekst i midten -->
                <text x="18" y="20.35" class="fill-current text-${colorClass}-600" font-size="6" text-anchor="middle">${score}%</text>
            </svg>
            <div class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">${label}</div>
        </div>`;
    }

    // Tilføj charts til siden
    const chartContainer = document.createElement("div");
    chartContainer.className = "w-full flex flex-wrap justify-center items-center gap-8 py-6";
    chartContainer.innerHTML = `
        ${createDonut(avgAll, "CIS SCORE", "blue", "w-32 h-32", "text-xl")}
        ${createDonut(avgIG1, "IG1", "green")}
        ${createDonut(avgIG2, "IG2", "orange")}
        ${createDonut(avgIG3, "IG3", "indigo")}
    `;
    root.appendChild(chartContainer);

    // ========== FILTER DROPDOWN ==========
    const savedFilter = localStorage.getItem("selectedFilter") || "All";

    const filterContainer = document.createElement("div");
    filterContainer.className = "flex justify-end items-center gap-2 px-6 py-3 w-3/4 mx-auto mb-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800";

    const filterLabel = document.createElement("label");
    filterLabel.innerText = "Filter status:";
    filterLabel.className = "mr-2 font-medium";

    const filterSelect = document.createElement("select");
    filterSelect.className = "border rounded p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    
    // Tilføj alle status muligheder
    ["All", "Implemented", "In Progress", "Missing", "Planned", "Not Applicable"].forEach(status => {
        const opt = document.createElement("option");
        opt.value = status;
        opt.innerText = status;
        if (status === savedFilter) opt.selected = true;
        filterSelect.appendChild(opt);
    });

    // Når filter ændres, gem og reload
    filterSelect.addEventListener("change", () => {
        localStorage.setItem("selectedFilter", filterSelect.value);
        fetchAndRenderControls();  // Reload hele UI
    });

    // Report knap
    const reportButton = document.createElement("button");
    reportButton.innerText = "Get Report";
    reportButton.className = "bg-slate-500 hover:bg-slate-400 text-white font-semibold px-4 py-2 rounded";
    reportButton.addEventListener("click", () => {
        generateReportPDF(controls);
    });

    filterContainer.appendChild(reportButton);
    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(filterSelect);
    root.appendChild(filterContainer);

    // ========== PDF GENERATION ==========
    function generateReportPDF(controls) {
        const allSubControls = controls.flatMap(c => c.subControls);
        const scores = { IG1: [], IG2: [], IG3: [], all: [] };

        // Beregn scores
        allSubControls.forEach(sc => {
            if (typeof sc.fulfillment === "number") {
                const group = (sc.implementationGroup || "").trim().toUpperCase();
                if (group.includes("1")) scores.IG1.push(sc.fulfillment);
                else if (group.includes("2")) scores.IG2.push(sc.fulfillment);
                else if (group.includes("3")) scores.IG3.push(sc.fulfillment);
                scores.all.push(sc.fulfillment);
            }
        });

        const average = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b) / arr.length) : 0;

        // Byg HTML rapport
        const reportHTML = `
    <div style="font-family: sans-serif; padding: 20px;">
        <h1>CIS18 Compliance Report</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <h2>Average Scores</h2>
        <ul>
            <li><strong>IG1:</strong> ${average(scores.IG1)}%</li>
            <li><strong>IG2:</strong> ${average(scores.IG2)}%</li>
            <li><strong>IG3:</strong> ${average(scores.IG3)}%</li>
            <li><strong>Overall:</strong> ${average(scores.all)}%</li>
        </ul>
        <hr/>
        ${controls.map(control => {
            const validScores = control.subControls.map(s => s.fulfillment).filter(n => typeof n === 'number');
            const avgScore = average(validScores);
            return `
                <h3>${control.id} – ${control.name} (Avg: ${avgScore}%)</h3>
                <table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 13px;">
                    <tr style="background-color: #f0f0f0;">
                        <th>SubControl</th>
                        <th>Status</th>
                        <th>Fulfillment</th>
                        <th>Comment</th>
                    </tr>
                    ${control.subControls.map(sub => `
                        <tr>
                            <td>${sub.name}</td>
                            <td>${sub.status || "-"}</td>
                            <td>${sub.fulfillment != null ? sub.fulfillment + "%" : "-"}</td>
                            <td>${sub.comment || ""}</td>
                        </tr>
                    `).join("")}
                </table>
            `;
        }).join("")}
    </div>
        `;

        // Hent eller opret PDF container
        let reportDiv = document.getElementById("pdf-report");
        if (!reportDiv) {
            reportDiv = document.createElement("div");
            reportDiv.id = "pdf-report";
            reportDiv.classList.add("hidden");
            document.body.appendChild(reportDiv);
        }

        reportDiv.innerHTML = reportHTML;
        reportDiv.classList.remove("hidden");

        // Konvertér til PDF
        setTimeout(() => {
            html2pdf()
                .set({
                    margin: 0.5,
                    filename: `CIS18_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                })
                .from(reportDiv)
                .save()
                .then(() => {
                    reportDiv.classList.add("hidden");
                });
        }, 100);
    }

    // ========== TEGN CONTROLS ==========
    const filteredStatus = savedFilter;

    controls.forEach(control => {
        // Beregn gennemsnitlig score
        const validScores = control.subControls.map(s => s.fulfillment).filter(n => typeof n === 'number');
        const avgScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b) / validScores.length) : 0;

        // Hop over hvis filter udelukker denne
        if (filteredStatus !== "All" && !control.subControls.some(sc => sc.status === filteredStatus)) return;

        // Main container
        const container = document.createElement("div");
        container.className = "w-3/4 mx-auto rounded shadow mb-6 overflow-hidden bg-blue-100 dark:bg-slate-700 cursor-pointer";

        // Header (kan klikkes for at toggle)
        const header = document.createElement("div");
        header.className = "flex items-center px-6 py-6";
        header.innerHTML = `
    <div class="flex items-center">
        <div class="text-[70px] font-serif leading-none text-gray-800 dark:text-gray-100">
            ${control.id.toString().padStart(2, '0')}
        </div>
        <div class="ml-6">
            <div class="text-xl font-bold text-gray-800 dark:text-white">${control.name}</div>
            <div class="text-sm text-gray-600 dark:text-gray-300">Avg: ${avgScore}%</div>
        </div>
    </div>
    <div class="ml-auto text-2xl transition-transform duration-200 toggle-arrow">▼</div>
`;

        // SubControl container (skjult som standard)
        const subControlContainer = document.createElement("div");
        subControlContainer.className = "bg-white dark:bg-gray-900 px-4 py-4 space-y-4 hidden";

        // Tilføj hver subcontrol
        control.subControls.forEach(sub => {
            if (filteredStatus !== "All" && sub.status !== filteredStatus) return;

            // Sub header (kan klikkes for at vise detaljer)
            const subHeader = document.createElement("div");
            subHeader.className = `px-4 py-3 rounded-lg font-semibold cursor-pointer ${getStatusColorClass(sub.status)}`;
            subHeader.innerText = `${sub.name} – ${sub.status}`;

            // Detail view (skjult som standard)
            const detailDiv = document.createElement("div");
            detailDiv.className = "rounded-md border p-4 mt-2 hidden bg-white dark:bg-gray-800 opacity-0 transition-all";

            detailDiv.innerHTML = `
                <p class="text-sm mb-4">${sub.description}</p>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-medium mb-1">Status:</label>
                        <select class="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700" data-field="status">
                            <option value="Implemented" ${sub.status === "Implemented" ? "selected" : ""}>Implemented</option>
                            <option value="In Progress" ${sub.status === "In Progress" ? "selected" : ""}>In Progress</option>
                            <option value="Missing" ${sub.status === "Missing" ? "selected" : ""}>Missing</option>
                            <option value="Planned" ${sub.status === "Planned" ? "selected" : ""}>Planned</option>
                            <option value="Not Applicable" ${sub.status === "Not Applicable" ? "selected" : ""}>Not Applicable</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Fulfillment (%):</label>
                        <select class="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700" data-field="fulfillment">
                            <option value="0" ${sub.fulfillment === 0 ? "selected" : ""}>0%</option>
                            <option value="25" ${sub.fulfillment === 25 ? "selected" : ""}>25%</option>
                            <option value="50" ${sub.fulfillment === 50 ? "selected" : ""}>50%</option>
                            <option value="75" ${sub.fulfillment === 75 ? "selected" : ""}>75%</option>
                            <option value="100" ${sub.fulfillment === 100 ? "selected" : ""}>100%</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-medium mb-1">Impact Score:</label>
                        <select class="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700" data-field="impactScore">
                            <option value="1" ${sub.impactScore === 1 ? "selected" : ""}>1 - Acceptable</option>
                            <option value="2" ${sub.impactScore === 2 ? "selected" : ""}>2 - Unacceptable</option>
                            <option value="3" ${sub.impactScore === 3 ? "selected" : ""}>3 - Catastrophic</option>
                        </select>
                    </div>
                </div>

                <div class="mt-4">
                    <label class="block font-medium mb-1">Comment:</label>
                    <textarea class="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700" data-field="comment">${sub.comment || ""}</textarea>
                </div>

                <div class="flex justify-between mt-4">
                    <button class="bg-gray-300 px-4 py-2 rounded save-btn bg-emerald-500 hover:bg-emerald-600 text-white">
                        Save
                    </button>
                </div>
            `;

            // Toggle detail view
            subHeader.addEventListener("click", () => {
                if (detailDiv.classList.contains("hidden")) {
                    detailDiv.classList.remove("hidden");
                    setTimeout(() => {
                        detailDiv.classList.remove("opacity-0");
                        detailDiv.classList.add("opacity-100");
                    }, 10);
                } else {
                    detailDiv.classList.remove("opacity-100");
                    detailDiv.classList.add("opacity-0");
                    setTimeout(() => detailDiv.classList.add("hidden"), 300);
                }
            });

            // Save button
            detailDiv.querySelector(".save-btn").addEventListener("click", async () => {
                const inputs = detailDiv.querySelectorAll("[data-field]");
                const updatedSub = {};
                inputs.forEach(input => {
                    updatedSub[input.getAttribute("data-field")] = input.value;
                });

                try {
                    const res = await fetch(`/api/controls/${control.id}/subcontrols/${sub._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedSub),
                    });

                    if (res.ok) {
                        alert("✅ Saved!");
                        location.reload();
                    } else {
                        alert("❌ Error: " + (await res.json()).error);
                    }
                } catch (err) {
                    alert("❌ Server error: " + err.message);
                }
            });

            subControlContainer.appendChild(subHeader);
            subControlContainer.appendChild(detailDiv);
        });

        // Toggle subcontrol visibility
        header.addEventListener("click", () => {
            subControlContainer.classList.toggle("hidden");
            const arrow = header.querySelector(".toggle-arrow");
            arrow.classList.toggle("rotate-180");
        });

        container.appendChild(header);
        container.appendChild(subControlContainer);
        root.appendChild(container);
    });

    // Helper: Farver baseret på status
    function getStatusColorClass(status) {
        const colors = {
            "Implemented": "bg-emerald-100 dark:bg-emerald-250",
            "In Progress": "bg-amber-100 dark:bg-amber-175",
            "Missing": "bg-rose-100 dark:bg-rose-200",
            "Planned": "bg-violet-100 dark:bg-violet-200",
            "Not Applicable": "bg-slate-100 dark:bg-slate-200"
        };
        return colors[status] || "bg-slate-50 dark:bg-slate-100";
    }
}