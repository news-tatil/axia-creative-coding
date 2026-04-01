ui_data = Object.create(null)

const menu_opt = [

    {
        no_ui_buttons: true,
        collapsed: false,
        logo: "./assets/illustration/img/logo_axia.svg",
        title: "",
        items: [
            { type: "file", name: "load", text: "Carregar arquivo", callback: loadAsset },
            // { type: "file", name: "load_image", text: "Carrega imagem", callback: loadImage },
            {
                type: "gridselector",
                name: "tex_versao",
                text: "Versão da textura",
                multiselector: false,
                unselect: true,
                columns: 2,
                options: [
                    { name: "a", text: "Positiva", value: "positiva", selected: true },
                    { name: "b", text: "Negativa", value: "negativa" },
                ],
            },
            {
                type: "gridselector",
                name: "tex_cor_versao",
                text: "",
                multiselector: false,
                unselect: true,
                callback: updateColors,
                columns: 2,
                options: [
                    { name: "a", text: "Colorida", value: "cor", selected: true },
                    { name: "b", text: "Monocromática", value: "mono" },
                ],
            },
            {
                type: "gridselector",
                name: "selector_background",
                text: "Cor de fundo",
                unselect: true,
                columns: 4,
                callback: updateColors,
                options: [
                    { name: "f", color: "#FAF5F0", value: "#FAF5F0" },
                    { name: "e", color: "#A0B4D2", value: "#A0B4D2" },
                    { name: "c", color: "#0000FF", value: "#0000FF", selected: true },
                    { name: "d", color: "#0A003C", value: "#0A003C" },
                ],
            },
            {
                type: "slider",
                name: "tex_res",
                text: "Tamanho dos conectores",
                min: 5,
                max: 50,
                value: 10,
                callback: makeTexture,
            },
            {
                type: "range_slider",
                name: "tex_levels",
                text: "Contraste",
                min: 0,
                max: 255,
                start: 0,
                end: 255,
            },
            {
                type: "slider",
                name: "tam_forma",
                text: "Tamanho máximo dos conectores",
                min: 1,
                max: 400,
                value: 160,
                // callback: makeTexture,
            },

            {
                type: "slider",
                name: "tex_tamMin",
                text: "Tamanho mínimo dos conectores",
                min: 1,
                max: 100,
                value: 20,
                // callback: makeTexture,
            },
            {
                type: "gridselector",
                name: "motion_on",
                text: "",
                multiselector: false,
                unselect: true,
                columns: 2,
                options: [
                    { name: "a", text: "Estático", value: "parado", selected: true },
                    { name: "b", text: "Movimento", value: "movimenta" },
                ],
            },
            {
                type: "slider",
                name: "motion_duracao",
                text: "Duração do movimento (segundos)",
                callback: resetTotalFrames,
                min: 1,
                max: 10,
                value: 5,
            },

        ],
    },
    {
        // logo: true,
        title: "EXPORTAR",
        collapsed: false,
        no_ui_buttons: true,
        items: [
            {
                type: "double_number",
                name: ["exportW", "exportH"],
                text: "Resolução",
                value: [1920, 1080],
                callback: updateExportSize,
            },
            { type: "number", name: "fps", text: "FPS", value: 30, callback: resetFps },
            { type: "checkbox", name: "transparent_background", text: "Salvar com fundo transparente", value: false },
            {
                type: "button",
                name: "save_mp4",
                text: "Salvar vídeo",
                callback: start_rec_mp4,
            },
            {
                type: "button",
                name: "save_frames_png",
                text: "Salvar frames em PNG",
                callback: start_rec_png,
            },
            { type: "button", name: "save_svg", text: "Salvar svg", callback: save_svg },
            {
                type: "button",
                name: "save_png",
                text: "Salvar PNG",
                callback: save_png,
            },
            // { type: "button", name: "save_preset", text: "Salvar preset", callback: savePreset },
            // { type: "file", name: "load_preset", text: "Carregar preset", callback: loadPresetData },
        ],
    },
]

const ui_left = new UI_window({
    name: "menu",
    sections: menu_opt,
    data: ui_data,
})
