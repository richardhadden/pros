module.exports = {
    mode: 'jit',
    content: ['./src/**/*.{js,ts,jsx,tsx}', '../*/interface/**/*.{js,ts,jsx,tsx}'],
    plugins: [require('daisyui'), require('@tailwindcss/typography')],
    safelist: ["col-start-1", "col-start-2", "col-start-3", "col-start-4", "col-start-5", "col-start-6"],
    daisyui: {
        themes: [{
            light: {
                ...require("daisyui/src/colors/themes")["[data-theme=light]"],
                "--rounded-btn": "0.1rem"
            },
        }, ],
    },
};