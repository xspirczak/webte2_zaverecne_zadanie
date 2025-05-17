document.addEventListener("DOMContentLoaded", async () => {
    const contentDiv = document.getElementById("manual-content");

    // Zisti aktuálny jazyk – ak nie je nastavený, predvolený je "sk"
    const lang = localStorage.getItem("language") || "sk";
    const manualId = lang === "en" ? 2 : 1;

    try {
        const res = await fetch(`${BACKEND_URL}/manual/${manualId}`);
        if (!res.ok) throw new Error("Nepodarilo sa načítať manuál");
        const html = await res.text();
        contentDiv.insertAdjacentHTML('beforeend', html);
    } catch (err) {
        contentDiv.innerHTML = "<p class='text-danger'>Nepodarilo sa načítať príručku.</p>";
        console.error(err);
    }

    const role = localStorage.getItem("role");
    if (role === "admin") {
        document.getElementById("editBtn").classList.remove("d-none");
        document.getElementById("editBtn").addEventListener("click", () => {
            window.location.href = "manual_edit.html";
        });
    }
});

async function exportManual() {
    try {
        const response = await fetch(`${BACKEND_URL}/manual/pdf`);
        if (!response.ok) throw new Error("Chyba pri generovaní PDF.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "manual.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Chyba:", error);
    }
}

