window.ImageCropper = (function () {
    const DEFAULT_OPTIONS = {
        width: 200,
        height: 200
    };
    const IC_PREFIX = 'ic-';
    const IC_VIEW_PREFIX = 'ic-view-';

    const TEMPLATE = '<div class="image-cropper-container" id="@%icId%@">' +
        '<div class="image-view" id="@%icViewId%@" style="width: @%width%@px;height: @%height%@px;"></div>' +
        '<label for="@%inputId%@" class="file-label">' +
        'Chọn ảnh' +
        '</label>' +
        '</div>';

    var instances = {};

    function drawTemplate(instance) {
        var inputElement = document.getElementById(instance.inputId);
        var html = TEMPLATE.replace(/@%inputId%@/g, instance.inputId)
            .replace(/@%icId%@/g, IC_PREFIX + instance.inputId)
            .replace(/@%icViewId%@/g, IC_VIEW_PREFIX + instance.inputId)
            .replace(/@%width%@/g, instance.options.width)
            .replace(/@%height%@/g, instance.options.height);
        inputElement.insertAdjacentHTML('beforebegin', html);
        inputElement.style.display = 'none';
    }

    function replaceOptions(options = {}) {
        var newOptions = {};
        Object.keys(DEFAULT_OPTIONS).forEach(function(key) {
            newOptions[key] = options[key] ? options[key] : DEFAULT_OPTIONS[key];
        });

        return newOptions;
    }

    function addEvents(instance) {
        addImageChangeEvents(instance);

        // console.log(inputElement.closest('form'));
    }

    function addImageChangeEvents(instance) {
        var inputElement = document.getElementById(instance.inputId);
        var onChangeFile = function (event) {
            var files = event.target.files;
            instance.file = files.length > 0 ? files[0] : null;
            getOrientation(instance.file, function (orientation) {
                instance.imageOptions.orientation = orientation;
                changeImage(instance);
            });
        };
        instance.events.push({
            elementId: instance.inputId,
            name: 'change',
            func: onChangeFile
        });
    }

    function listenEvents(instance) {
        instance.events.forEach(function (event) {
            var element = document.getElementById(event.elementId);
            if (!element) {
                console.log('Element #' + event.elementId + ' not found');
                return;
            }
            element.addEventListener(event.name, event.func);
        });
    }

    function removeEventsListener(instance) {
        instance.events.forEach(function (event) {
            var element = document.getElementById(event.elementId);
            if (!element) {
                console.log('Element #' + event.elementId + ' not found');
                return;
            }
            element.removeEventListener(event.name, event.func);
        });
    }

    function changeImage(instance) {
        var img;
        img = new Image();
        img.onload = function() {
            var width = img.width,
                height = img.height,
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            if (4 < instance.imageOptions.orientation && instance.imageOptions.orientation < 9) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }

            switch (instance.imageOptions.orientation) {
                case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
                case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
                case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
                case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
                case 7: ctx.transform(0, -1, -1, 0, height , width); break;
                case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
                default: break;
            }

            ctx.drawImage(img, 0, 0);

            instance.imageOptions.originWidth = width;
            instance.imageOptions.originHeight = height;

            setImageToView(instance, canvas.toDataURL());
        };

        img.src = URL.createObjectURL(instance.file);
    }

    function getOrientation(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var view = new DataView(e.target.result);
            if (view.getUint16(0, false) != 0xFFD8) {
                return callback(-2);
            }
            var length = view.byteLength, offset = 2;
            while (offset < length) {
                var marker = view.getUint16(offset, false);
                offset += 2;
                if (marker == 0xFFE1) {
                    if (view.getUint32(offset += 2, false) != 0x45786966) {
                        return callback(-1);
                    }
                    var little = view.getUint16(offset += 6, false) == 0x4949;
                    offset += view.getUint32(offset + 4, little);
                    var tags = view.getUint16(offset, little);
                    offset += 2;
                    for (var i = 0; i < tags; i++) {
                        if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                            return callback(view.getUint16(offset + (i * 12) + 8, little));
                        }
                    }
                }
                else if ((marker & 0xFF00) != 0xFF00) break;
                else offset += view.getUint16(offset, false);
            }
            return callback(-1);
        };
        reader.readAsArrayBuffer(file);
    }

    function setImageToView(instance, data) {
        var element = document.getElementById(IC_VIEW_PREFIX + instance.inputId);
        if (element && element.tagName == 'DIV') {
            element.style.backgroundImage = "url('" + data + "')";
        } else {
            console.log('Image view not set');
        }
    }

    function destroy(instanceName) {
        if (instances[instanceName]) {
            instance.desFuncs.forEach(function (func) {
                if (typeof func == 'function') {
                    func();
                }
            });

            delete instances[instanceName];
        }
    }

    function makeInstance(inputId, options) {
        return {
            inputId: inputId,
            options: replaceOptions(options),
            desFuncs: [],
            events: [],
            imageOptions: makeImageOptions(),
            file: null
        };
    }

    function makeImageOptions() {
        return {
            orientation: 1,
            originWidth: 0,
            originHeight: 0
        };
    }

    function replace(inputId, options) {
        if (instances[inputId]) {
            return instances[inputId];
        }

        var inputElement = document.getElementById(inputId);

        if (!inputElement) {
            console.log('Input element not found');
            return null;
        }

        var instance = makeInstance(inputId, options);

        drawTemplate(instance);
        addEvents(instance);
        listenEvents(instance);
        instances[inputId] = instance;

        return instance;
    }


    return {
        replace: replace,
        instances: instances,
    };
}());
