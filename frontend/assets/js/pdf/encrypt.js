document.getElementById("encryptBtn").onclick = async () => {
    const fileInput = document.getElementById("pdfFile");
    const passwordInput = document.getElementById("passwordInput");
    const downloadLink = document.getElementById("downloadLink");

    const file = fileInput.files[0];
    const password = passwordInput.value;

    if (!file || !password) {
        alert("Vyberte súbor a zadajte heslo.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);

    const response = await fetch(`${BACKEND_URL}/pdf/encrypt`, {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = "secured.pdf";
        downloadLink.style.display = "inline-block";
    } else {
        alert("Chyba pri zaheslovaní PDF.");
    }
};
