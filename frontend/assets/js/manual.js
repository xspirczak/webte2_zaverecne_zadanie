function exportManual() {
    // Predpoklad: backend endpoint napr. /api/manual/pdf
    fetch('http://localhost:8000/api/manual/pdf', {
        method: 'GET'
    })
        .then(response => {
            if (!response.ok) throw new Error("Nepodarilo sa exportovať");
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pouzivatelska_prirucka.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(err => alert("Chyba pri exporte: " + err.message));
}