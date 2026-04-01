function makeTexture() {
    let opt_textura = {
        img_textura: loaded_frames,
        res: parseInt(ui_data.tex_res),
    }
    if (axis_textura) axis_textura.destroy()
    axis_textura = new Texture(opt_textura)
}

function resetNoise() {
    noise = new OpenSimplexNoise(Date.now())
}

function updateColors() {
    let clr_bg = ui_data.selector_background

    let versao = ui_data.tex_cor_versao

    if (versao == "cor") {
        if (clr_bg == "#FAF5F0") {
            clrs_texture = ["#FFFFFF", "#A0B4D2", "#0000FF", "#0A003C"]
        } else if (clr_bg == "#A0B4D2") {
            clrs_texture = ["#FAF5F0", "#0000FF", "#0A003C"]
        } else if (clr_bg == "#0000FF") {
            clrs_texture = ["#FAF5F0", "#A0B4D2", "#0A003C"]
        } else if (clr_bg == "#0A003C") {
            clrs_texture = ["#FAF5F0", "#A0B4D2", "#0000FF"]
        }
        // ui_data.tex_tamMin = 40
    } else if (versao == "mono") {
        if (clr_bg == "#FAF5F0") {
            clrs_texture = ["#0000FF"]
        } else if (clr_bg == "#A0B4D2") {
            clrs_texture = ["#0A003C"]
        } else if (clr_bg == "#0000FF") {
            clrs_texture = ["#FFFFFF"]
        } else if (clr_bg == "#0A003C") {
            clrs_texture = ["#FAF5F0"]
        }
        // ui_data.tex_tamMin = 30
        ui_left.refresh()
    }
}
function setup_clrsTexture() {
    clrs_texture = ui_data.cores_s_fundo.split("\n").map((c) => c.trim())
    //verify if clrs_texture elements are valid colors
    clrs_texture = clrs_texture.filter((c) => /^#[0-9A-F]{6}$/i.test(c))
}

function setDesenhoDenditro() {
    // ui_data.tam_forma = 83
    ui_data.denditro_curva = 1009
    ui_data.denditro_angulo_curva = 5
    ui_data.denditro_raio = 73
}

function checkDir(v0, v1, v2) {
    // Check if the points v0, v1, v2 are in clockwise order
    let cross = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)
    return cross < 0 // If cross product is negative, points are in clockwise order
}

function resetTotalFrames() {
    if (img_kind == "video") totalFrames = loaded_frames.length
    else if (img_kind == "gif") totalFrames = loaded_frames.length
    else totalFrames = parseInt(ui_data.motion_duracao) * parseInt(ui_data.fps) //parseInt(ui_data.rot_time) * parseInt(ui_data.fps)
}

function resetFps() {
    if (ui_data.fps < 1) {
        ui_data.fps = 1
    }
    frameRate(parseInt(ui_data.fps))
    resetTotalFrames()
}

function updateExportSize() {
  rec_screen = new Screen(ui_data.exportW, ui_data.exportH)
}

function nameFile() {
    var date = new Date().toISOString()
    return "Eletrobras_" + date
}

function drawFrame(c) {
    let wT = rec_screen.w * rec_screen.scale
    let hT = rec_screen.h * rec_screen.scale
    let dX = rec_screen.pos.x - wT * 0.5
    let dY = rec_screen.pos.y - hT * 0.5
    c.push()
    c.scale(1 / rec_screen.scale)
    c.translate(-dX, -dY)
    if (ui_data.transparent_background) c.clear()
    else c.background(ui_data.selector_background)

    axis_textura.draw(c)

    c.pop()
}

///////////////// SVG //////////////////

function save_svg() {
    var cnv = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH), SVG)
    cnv.pixelDensity(1)
    drawFrame(cnv)

    cnv.save(nameFile() + ".svg")
}

///////////////// PNG //////////////////

function save_png() {
    var cnv = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH))
    cnv.pixelDensity(1)
    drawFrame(cnv)

    cnv.save(nameFile() + ".png")
}

///////////////// MP4 with FFmpeg.wasm //////////////////

// Initialize FFmpeg at the beginning
let ffmpeg
// let frames = []  // removed: not used
let framePaths = []
let isFFmpegReady = false
let isCapturingFrame = false
let mp4WarmupFrames = 0

async function initFFmpeg() {
    try {
        ffmpeg = FFmpeg.createFFmpeg({
            log: false,
            corePath: new URL("assets/illustration/js/ffmpeg/ffmpeg-core.js", window.location.href).href,
        })
        await ffmpeg.load()
        isFFmpegReady = true
        console.log("FFmpeg.wasm loaded successfully")
    } catch (err) {
        console.error("Failed to load FFmpeg.wasm:", err)
        alert("Error loading video encoder. SharedArrayBuffer support required.")
    }
}

function setupFFmpeg() {
    initFFmpeg().catch((err) => console.error("Failed to load FFmpeg.wasm:", err))
}

function create_encoder_mp4() {
    framePaths = []
    isCapturingFrame = false
    frame_count = 0
}

// Optional: adjust here if you want more warmup frames
const DEFAULT_WARMUP_FRAMES = 2

function start_rec_mp4() {
    if (!isFFmpegReady) {
        alert("FFmpeg is still loading. Please try again in a few seconds.")
        return
    }
    frameRateUi = 5
    resetTotalFrames()
    create_encoder_mp4()
    saveMP4 = !saveMP4
    if (saveMP4) {
        mp4WarmupFrames = DEFAULT_WARMUP_FRAMES
    } else {
        end_rec_mp4()
    }
}

function save_frame_mp4() {
    if (!saveMP4) return

    // Warmup frames (render only)
    if (mp4WarmupFrames > 0) {
        mp4WarmupFrames--
        const w0 = parseInt(ui_data.exportW)
        const h0 = parseInt(ui_data.exportH)
        const warm = createGraphics(w0, h0)
        warm.pixelDensity(1)
        drawFrame(warm)
        warm.remove()
        return
    }

    if (isCapturingFrame) return
    isCapturingFrame = true

    const w = parseInt(ui_data.exportW)
    const h = parseInt(ui_data.exportH)
    const displayIndex = frame_count + 1 // logical first = 1 (we will duplicate to 0000 later)

    const c = createGraphics(w, h)
    c.pixelDensity(1)
    drawFrame(c)

    c.elt.toBlob((blob) => {
        if (!blob) {
            console.warn("Blob null, skipping frame", displayIndex)
            isCapturingFrame = false
            c.remove()
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const frameName = `frame_${displayIndex.toString().padStart(4, "0")}.png`
            framePaths.push(frameName)
            ffmpeg.FS("writeFile", frameName, new Uint8Array(reader.result))
            frame_count++
            isCapturingFrame = false
            if (frame_count >= totalFrames) end_rec_mp4()
        }
        reader.readAsArrayBuffer(blob)
        c.remove()
    }, "image/png")
}

async function end_rec_mp4() {
    frameRateUi = 60
    frameRate(parseInt(ui_data.fps))
    saveMP4 = false
    noLoop()

    const isTransparent = ui_data.transparent_background
    const format = isTransparent ? "mov" : "mp4"
    const outputFile = `output.${format}`

    const statusElement = document.createElement("div")
    statusElement.style.position = "fixed"
    statusElement.style.top = "50%"
    statusElement.style.left = "50%"
    statusElement.style.transform = "translate(-50%, -50%)"
    statusElement.style.background = "rgba(0, 0, 0, 0.7)"
    statusElement.style.color = "white"
    statusElement.style.padding = "20px"
    statusElement.style.borderRadius = "10px"
    statusElement.style.zIndex = "9999"
    statusElement.innerHTML = `Encoding ${isTransparent ? "transparent MOV" : "MP4"} video... Please wait.`
    document.body.appendChild(statusElement)

    const cleanupTemp = () => {
        framePaths.forEach((p) => {
            try {
                ffmpeg.FS("unlink", p)
            } catch {}
        })
        try {
            ffmpeg.FS("unlink", outputFile)
        } catch {}
        framePaths = []
    }

    try {
        let ffmpegArgs
        if (isTransparent) {
            ffmpegArgs = [
                "-framerate",
                ui_data.fps,
                "-start_number",
                "1",
                "-i",
                "frame_%04d.png",
                "-c:v",
                "png",
                "-pix_fmt",
                "rgba",
                "-movflags",
                "+faststart",
                outputFile,
            ]
        } else {
            // Duplicate first frame as frame_0000.png (QuickTime / Figma preroll)
            try {
                const first = ffmpeg.FS("readFile", "frame_0001.png")
                ffmpeg.FS("writeFile", "frame_0000.png", first)
            } catch (e) {
                console.warn("Could not duplicate first frame:", e)
            }
            const fpsInt = parseInt(ui_data.fps)
            ffmpegArgs = [
                "-framerate",
                ui_data.fps,
                "-start_number",
                "0",
                "-i",
                "frame_%04d.png",
                "-c:v",
                "libx264",
                "-crf",
                "16",
                "-preset",
                "medium",
                "-tune",
                "animation",
                "-g",
                String(fpsInt),
                "-keyint_min",
                String(fpsInt),
                "-bf",
                "0",
                "-x264-params",
                `keyint=${fpsInt}:min-keyint=${fpsInt}:scenecut=0:open-gop=0:bframes=0:ref=3`,
                "-pix_fmt",
                "yuv420p",
                "-profile:v",
                "high",
                "-level",
                "4.0",
                "-color_primaries",
                "bt709",
                "-color_trc",
                "bt709",
                "-colorspace",
                "bt709",
                "-movflags",
                "+faststart",
                outputFile,
            ]
        }

        await ffmpeg.run(...ffmpegArgs)

        const data = ffmpeg.FS("readFile", outputFile)
        const mimeType = isTransparent ? "video/quicktime" : "video/mp4"
        const blob = new Blob([data.buffer], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = nameFile() + "." + format
        a.click()
        URL.revokeObjectURL(url)
        cleanupTemp()
    } catch (error) {
        console.error("FFmpeg encoding error:", error)
        alert(`Error encoding ${format.toUpperCase()} video.`)
    } finally {
        document.body.removeChild(statusElement)
        frame_count = 0
        loop()
    }
}

///////////////// PNG frames //////////////////

function start_rec_png() {
    resetTotalFrames()
    frameRate(5)
    frameRateUi = 1
    frame_count = 0
    saveFramesPNG = !saveFramesPNG
    if (!saveFramesPNG) {
        frame_count = 0
        frameRate(parseInt(ui_data.fps))
        zip.remove("png")
    }
}

function save_frame_png() {
    var canvas = createGraphics(parseInt(ui_data.exportW), parseInt(ui_data.exportH))
    canvas.pixelDensity(1)
    drawFrame(canvas)

    canvas.elt.toBlob((blob) => {
        zip.folder("png").file("ELETROBRAS_" + ("000" + frame_count).slice(-4) + ".png", blob)
    })

    canvas.remove()
    if (frame_count < totalFrames - 1) frame_count++
    else end_rec_png()
}

function end_rec_png() {
    processingZIP = true
    zip.generateAsync({ type: "blob" }).then(function (content) {
        processingZIP = false
        saveAs(content, nameFile() + ".zip")
        zip.remove("png")
        loop()
    })
    saveFramesPNG = false
    frame_count = 0
    frameRate(parseInt(ui_data.fps))
}

///////////////// PRESETS //////////////////

function savePreset() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ui_data))
    let downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", nameFile() + ".json")
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    //saves ui_data to a .json file
}

function loadPresetData(data) {
    // Load the preset data into the UI
    let bkp_presets_denditros = ui_data.presets_denditros
    let bkp_preset_cor = ui_data.preset_cor
    let bkp_preset_tamanho = ui_data.preset_tamanho
    // let bkp_camera_posicao = ui_data.camera_posicao
    let bkp_versao_logo = ui_data.versao_logo

    ui_data = Object.assign(ui_data, data.data)

    // Restore the previous preset selection
    ui_data.presets_denditros = bkp_presets_denditros
    ui_data.preset_cor = bkp_preset_cor
    ui_data.preset_tamanho = bkp_preset_tamanho
    // ui_data.camera_posicao = bkp_camera_posicao
    ui_data.versao_logo = bkp_versao_logo
    // Refresh the UI elements
    ui_left.refresh()
    // presetTamanho()
    // presetCor()
    // makeTexture()
}

function resetPreset() {
    loadPresetData({ data: bkp_settings })
}


////////////// LOAD IMAGES AND VIDEOS //////////////

function loadAsset(v) {
    if (img_loaded || img_loaded == null) {
        if (v.type == "video" || v.type == "image") {
            img_kind = v.type

            if (img_kind == "image" && v.subtype == "gif") img_kind = "gif"
            img_loaded = false
            if (img_kind == "image" || img_kind == "gif") {
                img = loadImage(v.data, assetLoaded)
            } else if (img_kind == "video") {
                img = createVideo(v.data, assetLoaded)
            }
        }
    }
}

function resetPatterns() {
    pattern.makeCells()
}

function loadFrames() {
    loaded_frames = []
    chainLoadFrame(0)
}

function chainLoadFrame(n) {
    if (n >= totalFrames) {
        finalizeVideoFrames()
        return
    }

    const fps = parseInt(ui_data.fps)
    // Small epsilon to avoid borderline 0-sec black frame on some encodes
    const sec = n / fps + 0.00001

    const videoEl = img.elt

    const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked)
        try {
            const c = img.get()
            loaded_frames.push(c)
        } catch (e) {
            console.warn("Frame grab failed at", n, e)
        }
        // Next frame
        requestAnimationFrame(() => chainLoadFrame(n + 1))
    }

    // Safety timeout in case seeked never fires
    const safetyTimeout = setTimeout(() => {
        videoEl.removeEventListener("seeked", onSeeked)
        console.warn("Seek timeout at frame", n)
        try {
            const c = img.get()
            loaded_frames.push(c)
        } catch {}
        chainLoadFrame(n + 1)
    }, 1000)

    const wrappedOnSeeked = () => {
        clearTimeout(safetyTimeout)
        onSeeked()
    }

    videoEl.addEventListener("seeked", wrappedOnSeeked, { once: true })
    img.time(sec)
}

function finalizeVideoFrames() {
    img_loaded = true
    if (img) {
        img.remove()
        img = null
    }
    makeTexture()
}

function loadFramesGif() {
    loaded_frames = []
    chainLoadFrameGif(0)
}

function chainLoadFrameGif(n) {
    if (n < totalFrames) {
        img.setFrame(n)
        let c = img.get()
        loaded_frames.push(c)
        setTimeout(chainLoadFrameGif, 150, n + 1)
    } else
        setTimeout(() => {
            img_loaded = true
            img = null
            makeTexture()
        }, 150)
}

function assetLoaded() {
    if (img_kind == "video") {
        img.hide()
        img.stop()
        totalFrames = round(img.duration() * parseInt(ui_data.fps))
        loadFrames()
    } else if (img_kind == "gif") {
        img.pause()
        totalFrames = img.numFrames()
        loadFramesGif()
    } else if (img_kind == "image") {
        totalFrames = parseInt(ui_data.motion_duracao) * parseInt(ui_data.fps)
        img_loaded = true
        loaded_frames = [img.get()]
        makeTexture()
    }
}
