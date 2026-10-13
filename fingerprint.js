// fingerprint.js
const FingerprintManager = (() => {
    const STORAGE_KEY = "sv_fingerprint_credential";

    function isSupported() {
        return !!(
            window.isSecureContext &&
            window.PublicKeyCredential &&
            navigator.credentials
        );
    }

    function toBase64(buffer) {
        return btoa(
            String.fromCharCode(...new Uint8Array(buffer))
        );
    }

    function fromBase64(value) {
        return Uint8Array.from(
            atob(value),
            c => c.charCodeAt(0)
        );
    }

    async function register() {
        if (!isSupported()) {
            throw new Error("当前浏览器不支持 Touch ID 验证。");
        }

        alert(
    "当前网址：" + location.href +
    "\n来源：" + location.origin +
    "\n安全环境：" + window.isSecureContext
);


        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: crypto.getRandomValues(
                    new Uint8Array(32)
                ),
                rp: {
                    name: "Secure Vault Pro",
                    id: location.hostname
                    },
                user: {
                    id: crypto.getRandomValues(
                        new Uint8Array(16)
                    ),
                    name: "vault-user",
                    displayName: "Secure Vault User"
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }
                ],
                authenticatorSelection: {
                   
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "none"
            }
        });

        if (!credential) {
            throw new Error("Touch ID 注册失败。");
        }

        localStorage.setItem(
            STORAGE_KEY,
            toBase64(credential.rawId)
        );

        return true;
    }

    async function authenticate() {
        if (!isSupported()) {
            throw new Error("当前浏览器不支持 Touch ID 验证。");
        }

        const savedId = localStorage.getItem(STORAGE_KEY);

        if (!savedId) {
            throw new Error("请先启用 Touch ID。");
        }

        const credential = await navigator.credentials.get({
            publicKey: {
                challenge: crypto.getRandomValues(
                    new Uint8Array(32)
                ),
                allowCredentials: [{
                    type: "public-key",
                    id: fromBase64(savedId),
                    transports: ["internal"]
                }],
                userVerification: "required",
                timeout: 60000
            }
        });

        return !!credential;
    }

    function isRegistered() {
        return !!localStorage.getItem(STORAGE_KEY);
    }

    function unregister() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return {
        isSupported,
        register,
        authenticate,
        isRegistered,
        unregister
    };
})();

window.FingerprintManager = FingerprintManager;

window.testFingerprintSupport = async function () {
    const result = {
        secureContext: window.isSecureContext,
        webAuthn: !!window.PublicKeyCredential,
        credentialsAPI: !!navigator.credentials,
        prfAPI: false
    };

    if (window.PublicKeyCredential) {
        try {
            result.prfAPI =
                await PublicKeyCredential.getClientCapabilities()
                    .then(c => !!c.prf)
                    .catch(() => false);
        } catch (_) {}
    }

    alert(JSON.stringify(result, null, 2));
};

// Touch ID：注册入口与验证入口
document.addEventListener("DOMContentLoaded", () => {
    const enableBtn = document.getElementById("enableFingerprintBtn");
    const testBtn = document.getElementById("testFingerprintBtn");

    enableBtn?.addEventListener("click", async () => {
        try {
            await FingerprintManager.register();
            alert("Touch ID 注册成功。");
        } catch (error) {
            alert("注册失败：" + error.message);
        }
    });

    testBtn?.addEventListener("click", async () => {
        try {
            const verified = await FingerprintManager.authenticate();

            if (verified) {
                alert("Touch ID 验证成功，但尚未解密密码库。");
            }
        } catch (error) {
            alert("验证失败：" + error.message);
        }
    });
});


document.getElementById("testPRFBtn")
?.addEventListener("click", async () => {
    const result = {
        secureContext: window.isSecureContext,
        webAuthn: !!window.PublicKeyCredential,
        credentialsAPI: !!navigator.credentials,
        prfAPI: false
    };

    if (window.PublicKeyCredential?.getClientCapabilities) {
        try {
            const caps =
                await PublicKeyCredential.getClientCapabilities();
            result.prfAPI = !!caps.prf;
        } catch (e) {
            result.prfError = e.message;
        }
    }

    alert(JSON.stringify(result, null, 2));
});
