function showAlert(message, type = "info") {
    const alertDiv = document.getElementById("historyAlert");
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} text-center`;
    alertDiv.style.display = "block";
    setTimeout(() => {
        alertDiv.style.display = "none";
    }, 4000);
}

$(document).ready(function () {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        showAlert("Nie ste prihlásený.", "warning");
        window.location.href = "login.html";
        return;
    }

    const table = $('#historyTable').DataTable({
        ajax: function (data, callback, settings) {
            fetch(`${BACKEND_URL}/history/`, {
                headers: {
                    "Authorization": "Bearer " + accessToken
                }
            })
                .then(response => {
                    if (response.status === 401 || response.status === 403) {
                        showAlert("Neoprávnený prístup. Prihláste sa znova.", "danger");
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
                    showAlert("Chyba pri načítaní histórie.", "danger");
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
                    showAlert("Neoprávnený prístup.", "danger");
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
                showAlert("Export prebehol úspešne.", "success");
            })
            .catch(err => showAlert("Chyba pri exporte: " + err.message, "danger"));
    });

    // Otvorenie modalu pre potvrdenie vymazania
    $('#clearHistoryBtn').on('click', () => {
        $('#confirmDeleteModal').modal('show');
    });

    // Potvrdenie vymazania v modali
    $('#confirmDeleteBtn').on('click', () => {
        $('#confirmDeleteModal').modal('hide');

        fetch(`${BACKEND_URL}/history/`, {
            method: 'DELETE',
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        })
            .then(response => {
                if (response.status === 401 || response.status === 403) {
                    showAlert("Neoprávnený prístup.", "danger");
                    window.location.href = "login.html";
                    return;
                }
                return response.json();
            })
            .then(() => {
                table.ajax.reload();
                showAlert("História bola úspešne vymazaná.", "success");
            })
            .catch(err => showAlert("Chyba pri mazaní histórie: " + err.message, "danger"));
    });
});
