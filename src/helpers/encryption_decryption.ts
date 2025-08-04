import crypto from 'crypto'
import { passPhrase } from './constants';

export const handle_decrypt = async (data: string) => {
    try {
        const passphrase = passPhrase;

        const key = await crypto.subtle.importKey( "raw", new TextEncoder().encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"] );

        const derived_key = await crypto.subtle.deriveKey(
            {  name: "PBKDF2",  salt: new Uint8Array([]),   iterations: 100000,  hash: "SHA-256"  }, key,
            {  name: "AES-CBC", length: 256  }, true,
            ["decrypt"]
        );

        const passphrase_buffer = new TextEncoder().encode(passphrase);

        const hash_buffer = await crypto.subtle.digest('SHA-256', passphrase_buffer);

        const iv = new Uint8Array(hash_buffer.slice(0, 16));

        const encrypted_bytes = new Uint8Array(atob(data).split('').map(char => char.charCodeAt(0)));

        const encrypted_array_buffer = encrypted_bytes.buffer;

        const decrypted_array_buffer = await crypto.subtle.decrypt({ name: "AES-CBC", iv: iv }, derived_key, encrypted_array_buffer );

        let decrypted_data = new TextDecoder().decode(decrypted_array_buffer);

        return decrypted_data

    } catch (error) {
        console.error("Decryption failed:", error);
    }
};


export const handle_encrypt = async (data: string) => {

    try {

        const passphrase = passPhrase;

        const textEncoder = new TextEncoder();

        const encodedData = textEncoder.encode(data);

        const passphrase_buffer = new TextEncoder().encode(passphrase);

        const hash_buffer = await crypto.subtle.digest('SHA-256', passphrase_buffer);

        const iv = new Uint8Array(hash_buffer.slice(0, 16));

        const imported_key = await crypto.subtle.importKey(
            "raw",
            textEncoder.encode(passphrase),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new Uint8Array([]), 
                iterations: 100000,
                hash: "SHA-256"
            },
            imported_key,
            { name: "AES-CBC", length: 256 },
            true,
            ["encrypt"]
        );

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: iv,
            },
            key,
            encodedData
        );

        const encryptedData = btoa(String.fromCharCode(...Array.from(new Uint8Array(encrypted))));
        
        return encryptedData
        
        } catch (error) {

        console.error("Encryption failed:", error);
        
    }
    
}