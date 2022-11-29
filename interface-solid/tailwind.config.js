module.exports = {
    mode: 'jit',
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    plugins: [require('daisyui'), require('@tailwindcss/typography')],
    daisyui: {
        themes: [{
            light: {
                ...require("daisyui/src/colors/themes")["[data-theme=light]"],
                "--rounded-btn": "0.1rem"
            },
        }, ],
    },
};