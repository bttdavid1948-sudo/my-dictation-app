// Characterization reference only: parser bytes from parent2325295af2450f54f35d6f7da3dccae479dd2f9b.
        function parseLearningCSV(text) {
            const rows = [];
            let row = [], cell = '', quoted = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (quoted) {
                    if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
                    else if (char === '"') quoted = false;
                    else cell += char;
                } else if (char === '"') quoted = true;
                else if (char === ',') { row.push(cell); cell = ''; }
                else if (char === '\n' || char === '\r') {
                    if (char === '\r' && text[i + 1] === '\n') i++;
                    row.push(cell); rows.push(row); row = []; cell = '';
                } else cell += char;
            }
            if (quoted) throw new Error('CSV có ô chưa đóng dấu ngoặc kép.');
            if (cell || row.length) { row.push(cell); rows.push(row); }
            const clean = value => String(value || '').replace(/^\uFEFF/, '').trim();
            if (rows.length && /^(english|câu tiếng anh)$/i.test(clean(rows[0][0])) && /^(vietnamese|tiếng việt|bản dịch tiếng việt)$/i.test(clean(rows[0][1]))) rows.shift();
            return rows.filter(row => row.some(value => clean(value))).map(row => {
                if (row.length !== 2) throw new Error('CSV cần đúng hai cột English và Vietnamese.');
                const en = clean(row[0]), vi = clean(row[1]);
                if (!en || !vi) throw new Error('Mỗi dòng cần đủ câu tiếng Anh và bản dịch tiếng Việt.');
                return { en, vi };
            });
        }
