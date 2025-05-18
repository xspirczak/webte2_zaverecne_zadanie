let quillSk;
let quillEn;
let htmlSk;
let htmlEn;

function showAlert(message, type = "info") {
    const alertDiv = document.getElementById("editAlert");
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} text-center`;
    alertDiv.style.display = "block";
    setTimeout(() => {
        alertDiv.style.display = "none";
    }, 4000);
}
document.addEventListener("DOMContentLoaded", async () => {
    quillSk = new Quill("#manual-editor-sk", {
        theme: "snow",
        modules: {
            toolbar: [
                [{ container: "quill-toolbar-sk"}],
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });

    // Načítaj aktuálny obsah z DB
    const resSk = await fetch(`${BACKEND_URL}/manual/1`);
    htmlSk = await resSk.text();
    //console.log(htmlSk);
    quillSk.clipboard.dangerouslyPasteHTML(htmlSk); // Použi túto metódu


    quillEn = new Quill("#manual-editor-en", {
        theme: "snow",
        modules: {
            toolbar: [
                [{ container: "quill-toolbar-en"}],
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });



    // Načítaj aktuálny obsah z DB
    const resEn = await fetch(`${BACKEND_URL}/manual/2`);
    htmlEn = await resEn.text();
    //console.log(htmlSk);
    quillEn.clipboard.dangerouslyPasteHTML(htmlEn); // Použi túto metódu

    function stripHtml(html) {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
    }


    // Uloženie
    document.getElementById("saveBtn").addEventListener("click", async () => {
        const originalTextSk = stripHtml(htmlSk).trim().replace(/\s+/g, " ");
        const currentTextSk = quillSk.getText().trim().replace(/\s+/g, " ");

        const originalTextEn = stripHtml(htmlEn).trim().replace(/\s+/g, " ");
        const currentTextEn = quillEn.getText().trim().replace(/\s+/g, " ");

        const changedSk = originalTextSk !== currentTextSk;
        const changedEn = originalTextEn !== currentTextEn;

        const lang = localStorage.getItem("language") || "sk";
        if ((changedSk && !changedEn) || (!changedSk && changedEn)) {
            showAlert(lang === "sk" ? "Ak upravíte jednu verziu, musíte upraviť aj druhú." : "If you edit one version, you have to edit the other too.", "warning");
            return;
        }

        const responseSk = await fetch(`${BACKEND_URL}/manual/1`, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: quillSk.root.innerHTML
        });

        const responseEn = await fetch(`${BACKEND_URL}/manual/2`, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: quillEn.root.innerHTML
        });

        const results = await Promise.all([responseSk, responseEn]);

        if (results.every(res => res.ok)) {

            showAlert(lang === "sk" ? "Príručka bola uložená." : "Manual has been saved.", "success");
            setTimeout(() => {
                window.location.href = "manual.html";
            }, 3000);
        } else {
            showAlert(lang === "sk" ? "Chyba pri ukladaní príručky." : "Error while saving the manual.", "warning");
        }
    });
});