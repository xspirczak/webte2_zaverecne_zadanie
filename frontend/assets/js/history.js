const BACKEND_URL = "http://localhost:8000/api";

$(document).ready(function () {
    const accessToken = localStorage.getItem("access_token");

    // Ak token nie je, presmeruj
    if (!accessToken) {
        alert("Nie ste prihlásený.");
        window.location.href = "login.html";
        return;
    }

    const table = $('#historyTable').DataTable({
        ajax: function (data, callback, settings) {
            fetch(`${BACKEND_URL}/history`, {
                headers: {
                    "Authorization": "Bearer " + accessToken
                }
            })
                .then(response => {
                    if (response.status === 401 || response.status === 403) {
                        alert("Neoprávnený prístup. Prihláste sa znova.");
                        window.location.href = "login.html";
                        throw new Error("Neoprávnený prístup");
                    }
                    return response.json();
                })
                .then(data => {
                    callback({ data });
                })
                .catch(err => {
                    console.error("Chyba pri načítaní histórie:", err);
                    callback({ data: [] });
                });
        },
        columns: [
            { data: 'user_email' },
            { data: 'action' },
            { data: 'timestamp' },
            { data: 'access_type' },
            { data: 'city' },
            { data: 'country' }
        ]
    });

    $('#exportCsvBtn').on('click', () => {
        fetch(`${BACKEND_URL}/history/export`, {
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        })
            .then(response => {
                if (response.status === 401 || response.status === 403) {
                    alert("Neoprávnený prístup.");
                    window.location.href = "login.html";
                    return;
                }
                return response.blob();
            })
            .then(blob => {
                if (!blob) return;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "history.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => alert("Chyba pri exporte: " + err.message));
    });

    $('#clearHistoryBtn').on('click', () => {
        if (confirm("Naozaj chcete vymazať všetku históriu?")) {
            fetch(`${BACKEND_URL}/history`, {
                method: 'DELETE',
                headers: {
                    "Authorization": "Bearer " + accessToken
                }
            })
                .then(response => {
                    if (response.status === 401 || response.status === 403) {
                        alert("Neoprávnený prístup.");
                        window.location.href = "login.html";
                        return;
                    }
                    return response.json();
                })
                .then(() => {
                    table.ajax.reload();
                    alert("História bola úspešne vymazaná.");
                })
                .catch(err => alert("Chyba pri mazaní histórie: " + err.message));
        }
    });
});
