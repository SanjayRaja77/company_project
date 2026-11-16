/**
 * KCET Global Profile Picture Sync
 * --------------------------------------------------
 * 1. When user uploads photo on Profile page → saved
 *    to localStorage as base64.
 * 2. This script runs on EVERY page (loaded in <head>).
 * 3. It reads the saved photo and sets it on every
 *    #profile-img element — replacing the blank avatar.
 * 4. BroadcastChannel pushes updates to all open tabs
 *    instantly without any page reload.
 */

(function () {
    'use strict';

    var STORAGE_KEY   = 'kcet_profile_image';
    var PROFILE_KEY   = 'userProfile';
    var DEFAULT_IMG   = 'default-avatar.svg';   // shown when no photo uploaded
    var ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

    // Cross-tab broadcast channel
    var channel = null;
    try { channel = new BroadcastChannel('kcet_profile_sync'); } catch (e) {}

    // Get saved photo (base64) or fall back to default avatar
    function getProfileImage() {
        try {
            var img = localStorage.getItem(STORAGE_KEY);
            if (img && img !== 'null' && img !== 'undefined' && img.length > 10) return img;
        } catch (e) {}
        return DEFAULT_IMG;
    }

    // Apply image to ALL #profile-img elements on this page
    function applyImageToPage(src) {
        if (!src || src === 'null' || src === 'undefined' || src.length < 5) {
            src = DEFAULT_IMG;
        }
        document.querySelectorAll('#profile-img').forEach(function (img) {
            img.src = src;
            img.onerror = function () { this.src = DEFAULT_IMG; };
            img.style.objectFit    = 'cover';
            img.style.borderRadius = '50%';
        });
    }

    // Save photo → localStorage → broadcast to all open tabs
    function saveProfileImage(base64, empCode) {
        if (!base64 || base64.length < 10) return;
        try {
            localStorage.setItem(STORAGE_KEY, base64);
            var raw     = localStorage.getItem(PROFILE_KEY);
            var profile = {};
            try { profile = raw ? JSON.parse(raw) : {}; } catch (e) {}
            profile.image = base64;
            if (empCode) profile.code = empCode;
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (e) { return; }

        // Apply on this page immediately
        applyImageToPage(base64);

        // Broadcast to every other open tab
        if (channel) {
            try { channel.postMessage({ type: 'PROFILE_IMG_UPDATE', image: base64 }); } catch (e) {}
        }
    }

    // Listen for updates broadcast from other tabs
    if (channel) {
        channel.onmessage = function (evt) {
            if (evt.data && evt.data.type === 'PROFILE_IMG_UPDATE') {
                applyImageToPage(evt.data.image);
            }
        };
    }

    // localStorage fallback for Safari
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY && e.newValue && e.newValue.length > 10) {
            applyImageToPage(e.newValue);
        }
    });

    // Apply NOW (script is in <head>, before body renders)
    // This catches pages where #profile-img is below the <head>
    (function applyEarly() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved && saved !== 'null' && saved !== 'undefined' && saved.length > 10) {
                // DOM may not be ready yet — apply to any already-parsed elements
                document.querySelectorAll('#profile-img').forEach(function (el) {
                    el.src = saved;
                });
            }
        } catch (e) {}
    })();

    // Apply again when DOM is fully built
    document.addEventListener('DOMContentLoaded', function () {
        applyImageToPage(getProfileImage());
    });

    // Public API used by the upload modal in index.html
    window.KCET_PROFILE = {
        getImage:   getProfileImage,
        saveImage:  saveProfileImage,
        apply:      applyImageToPage,
        allowed:    ALLOWED_TYPES,
        defaultImg: DEFAULT_IMG
    };

})();
