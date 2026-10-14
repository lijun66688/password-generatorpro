// fingerprint.js 【修改版：cross-platform，不触发iCloud钥匙串】
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
        // 标准webauthn base64url（原版缺少替换+-_=，会报错！重要修复）
        return btoa(
            String.fromCharCode(...new Uint8Array(buffer))
        )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
    function fromBase64(value) {
        // base64url还原，原版解码没处理url安全字符，会出现解码失败BUG
        value = value.replace(/-/g, '+').replace(/_/g, '/');
        while(value.length %4) value += '=';
        return Uint8Array.from(
            atob(value),
            c => c.charCodeAt(0)
        );
    }
    async function register() {
        if (!isSupported()) {
            throw new Error("当前浏览器不支持 Touch ID 验证。");
        }
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
                // ========== 核心修改：cross-platform 代替 platform ==========
                authenticatorSelection: {
                    authenticatorAttachment: "cross-platform",
                    requireResidentKey: false,
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
                    // cross-platform不要写 transports:["internal"]，删掉或者留空
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
