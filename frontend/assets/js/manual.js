document.addEventListener("DOMContentLoaded", async () => {
    const contentDiv = document.getElementById("manual-content");

    try {
        const res = await fetch(`${BACKEND_URL}/manual`);
        const html = await res.text();
        contentDiv.insertAdjacentHTML('beforeend', html);

        //contentDiv.innerHTML = html;
    } catch (err) {
        contentDiv.innerHTML = "<p class='text-danger'>Nepodarilo sa načítať príručku.</p>";
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

