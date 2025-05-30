document.addEventListener('DOMContentLoaded', () => {
    const zipFileInput = document.getElementById('zipFile');
    const passwordInput = document.getElementById('password');
    const checkPasswordButton = document.getElementById('checkPasswordButton');
    const resultMessageElement = document.getElementById('result-message');

    checkPasswordButton.addEventListener('click', async () => {
        // Clear previous messages and styles
        resultMessageElement.textContent = '';
        resultMessageElement.className = '';

        const file = zipFileInput.files[0];
        const password = passwordInput.value;

        if (!file) {
            resultMessageElement.textContent = 'Please select a ZIP file.';
            resultMessageElement.className = 'error';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target.result;
            const zip = new JSZip();

            try {
                const zipData = await zip.loadAsync(arrayBuffer);
                const fileNames = Object.keys(zipData.files);

                if (fileNames.length === 0) {
                    resultMessageElement.textContent = 'The ZIP file is empty or corrupted.';
                    resultMessageElement.className = 'error';
                    return;
                }

                // Attempt to access the first file's content
                // This is a simplified check. JSZip might not decrypt all types of encrypted zips,
                // or might not error out if the password is wrong but the central directory is readable.
                try {
                    const firstFileName = fileNames[0];
                    // Check if the file is not a directory
                    if (!zipData.files[firstFileName].dir) {
                         // Providing the password to async if JSZip would use it for decryption.
                         // JSZip's documentation indicates password is for DEFLATE with password,
                         // which is not standard AES encryption.
                         // For many encrypted zips, this will throw an error if password is wrong
                         // or if encryption is not supported for reading with password.
                        await zipData.files[firstFileName].async('arraybuffer', { password: password });
                    }
                    // If the above doesn't throw an error:
                    if (password) {
                        resultMessageElement.textContent = 'Password appears to be correct and file loaded successfully.';
                        resultMessageElement.className = 'success';
                    } else {
                        resultMessageElement.textContent = 'File loaded successfully (no password entered/needed).';
                        resultMessageElement.className = 'success';
                    }
                } catch (e) {
                    // This catch block is crucial for password checking
                    console.error("Error during file content access:", e);
                    if (password) {
                        resultMessageElement.textContent = 'Incorrect password, unsupported encryption, or corrupted file.';
                        resultMessageElement.className = 'error';
                    } else {
                        // If no password was entered, but reading fails, it might be an encrypted file
                        // or a corrupted one.
                        resultMessageElement.textContent = 'File might be password-protected or corrupted. Please try providing a password if it is.';
                        resultMessageElement.className = 'error';
                    }
                }

            } catch (err) {
                console.error("Error loading ZIP:", err);
                resultMessageElement.textContent = `Error loading ZIP: ${err.message}. It might be corrupted or an unsupported format.`;
                resultMessageElement.className = 'error';
                // If a password was provided, this error might also indicate an incorrect password
                // if the encryption affects the main ZIP structure reading.
                if (password && err.message.toLowerCase().includes("password")) {
                     resultMessageElement.textContent = 'Incorrect password or corrupted ZIP file.';
                }
            }
        };

        reader.onerror = () => {
            resultMessageElement.textContent = 'Error reading the file.';
            resultMessageElement.className = 'error';
        };

        reader.readAsArrayBuffer(file);
    });
});
