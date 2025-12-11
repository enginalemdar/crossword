const gridElement = document.getElementById('crossword-grid');

// 1. Izgarayı Oluşturma
function createGrid(data) {
    const boyut = data.boyut;
    gridElement.style.gridTemplateColumns = `repeat(${boyut}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${boyut}, 1fr)`;

    // Harita oluşturma (boş hücreler ve kelime ID'leri)
    // Harita indeksleri 0'dan başlar (0, 0'dan 9, 9'a)
    const gridMap = Array(boyut).fill(0).map(() => Array(boyut).fill({ type: 'empty' }));

    // Kelimeleri haritaya yerleştirme
    data.kelimeler.forEach(word => {
        // x ve y koordinatları 1'den başladığı için 1 çıkarıyoruz
        let x_start = word.baslangic_x - 1;
        let y_start = word.baslangic_y - 1;

        for (let i = 0; i < word.cevap.length; i++) {
            let coordX = word.yon === 'yatay' ? x_start + i : x_start;
            let coordY = word.yon === 'yatay' ? y_start : y_start + i;

            // Koordinatların sınırları aşmadığından emin olun (Hata kontrolü)
            if (coordX < boyut && coordY < boyut) {
                // Eğer hücre zaten tanımlıysa, mevcut kelime ID'lerini birleştirin
                const existingData = gridMap[coordY][coordX];
                
                gridMap[coordY][coordX] = {
                    type: 'letter',
                    // Birden fazla kelime kesişirse, ID'leri bir array içinde tutabiliriz.
                    kelimeIDs: existingData.kelimeIDs ? [...existingData.kelimeIDs, word.id] : [word.id],
                    harfIndex: i,
                    soruNo: i === 0 ? word.id : null,
                    dogruHarf: word.cevap[i]
                };
            }
        }
    });

    // HTML hücrelerini oluşturma
    for (let y = 0; y < boyut; y++) {
        for (let x = 0; x < boyut; x++) {
            const cellData = gridMap[y][x];
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (cellData.type === 'empty') {
                // Kullanılmayan hücreleri siyah yap
                cell.classList.add('black-cell');
            } else {
                const input = document.createElement('input');
                input.maxLength = 1;
                // Kesişen hücrelerde tüm kelime ID'lerini tutarız
                input.dataset.wordIds = cellData.kelimeIDs.join(','); 
                input.dataset.x = x;
                input.dataset.y = y;
                
                // Sorunun ilk harfinde numarayı göster
                if (cellData.soruNo !== null) {
                    const clueNumber = document.createElement('span');
                    clueNumber.classList.add('clue-number');
                    clueNumber.textContent = cellData.soruNo;
                    cell.appendChild(clueNumber);
                }

                cell.appendChild(input);
            }
            gridElement.appendChild(cell);
        }
    }
}

// 2. Etkileşim ve Otomatik İlerleme
function setupInteraction(data) {
    // Bulmacanın o an odaklanılan yönünü tutar (yatay/dikey)
    let currentDirection = 'yatay'; 

    gridElement.addEventListener('click', (e) => {
        // Tıklanan hücre input ise yönü değiştir
        if (e.target.tagName === 'INPUT') {
            currentDirection = currentDirection === 'yatay' ? 'dikey' : 'yatay';
            e.target.focus();
        }
    });

    gridElement.addEventListener('input', (e) => {
        const input = e.target;
        if (input.tagName !== 'INPUT' || input.value.length === 0) return;

        const { x, y, wordIds } = input.dataset;
        const xNum = parseInt(x);
        const yNum = parseInt(y);
        
        // Bu hücrenin ait olduğu kelimeleri bul
        const relevantWords = data.kelimeler.filter(w => wordIds.split(',').includes(w.id.toString()));
        
        // Otomatik İlerleme için öncelikli kelimeyi (currentDirection ile uyumlu olanı) bul
        const primaryWord = relevantWords.find(w => w.yon === currentDirection) || relevantWords[0];
        
        if (!primaryWord) return;

        let nextX = xNum;
        let nextY = yNum;

        if (primaryWord.yon === 'yatay') {
            nextX += 1; // Sağa ilerle
        } else {
            nextY += 1; // Aşağı ilerle
        }

        // Bir sonraki hücreyi bul
        const nextCell = document.querySelector(`input[data-x='${nextX}'][data-y='${nextY}']`);

        if (nextCell) {
            nextCell.focus();
        } 
        
        // TODO: Tüm kelime doğruysa hücre rengini yeşil yapma mantığı eklenebilir.
    });
}

// 3. Soruları Listeleme
function listClues(data) {
    const yatayList = document.getElementById('yatay-sorular');
    const dikeyList = document.getElementById('dikey-sorular');

    // Soruları ID'ye göre sırala
    const sortedKelimeler = data.kelimeler.sort((a, b) => a.id - b.id);
    
    sortedKelimeler.forEach(word => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${word.id}.</strong> ${word.soru}`;
        
        if (word.yon === 'yatay') {
            yatayList.appendChild(listItem);
        } else {
            dikeyList.appendChild(listItem);
        }
    });
}

// 4. Uygulamayı Başlatma (Veriyi Çekme)
async function init() {
    let data;
    try {
        // Railway URL'sinde data.json dosyasını çekmeye çalış
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP Hata: ${response.status} - data.json yüklenemedi.`);
        }
        data = await response.json();
    } catch (error) {
        console.error("Bulmaca verisi yüklenirken hata oluştu:", error);
        // Kullanıcıya bilgi ver
        gridElement.innerHTML = '<p style="color: red;">Bulmaca verisi yüklenirken sorun oluştu. Konsolu kontrol edin.</p>';
        return; 
    }
    
    // Veri yüklendikten sonraki adımlar
    createGrid(data);
    listClues(data);
    setupInteraction(data);
}


// Uygulamayı Başlat
window.onload = init;
