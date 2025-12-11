const gridElement = document.getElementById('crossword-grid');
let puzzleData = null;
let currentDirection = 'yatay'; // Varsayılan yön

// 1. Izgarayı Oluşturma
function createGrid() {
    const boyut = puzzleData.boyut;
    gridElement.style.gridTemplateColumns = `repeat(${boyut}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${boyut}, 1fr)`;
    gridElement.innerHTML = ''; // Önceki içeriği temizle

    // Harita oluşturma: 0 = Boş/Siyah hücre; Objeler = Kelime içeren hücre
    const gridMap = Array(boyut).fill(0).map(() => Array(boyut).fill(0));

    // Kelimeleri haritaya yerleştirme
    puzzleData.kelimeler.forEach(word => {
        // Koordinatlar 1'den başladığı için 1 çıkarıyoruz (0-indeksli hale getiriyoruz)
        const x_start = word.baslangic_x - 1;
        const y_start = word.baslangic_y - 1;
        const direction = word.yon;

        for (let i = 0; i < word.cevap.length; i++) {
            let coordX, coordY;

            if (direction === 'yatay') {
                coordX = x_start + i;
                coordY = y_start;
            } else { // dikey
                coordX = x_start;
                coordY = y_start + i;
            }

            // Sınır kontrolü (16x16)
            if (coordX >= 0 && coordX < boyut && coordY >= 0 && coordY < boyut) {
                // Hücre objesi oluştur veya güncelle
                let cellInfo = gridMap[coordY][coordX];
                if (cellInfo === 0) {
                    cellInfo = {
                        wordIDs: [],
                        harfIndex: {},
                        soruNo: null,
                        dogruHarf: word.cevap[i]
                    };
                }
                
                // Kelime ID'sini ekle
                if (!cellInfo.wordIDs.includes(word.id)) {
                    cellInfo.wordIDs.push(word.id);
                }
                
                // Harf indeksini kaydet (hangi kelimede kaçıncı harf olduğunu tutar)
                cellInfo.harfIndex[word.id] = i;

                // Eğer kelimenin başlangıcıysa, soru numarasını ata
                if (i === 0) {
                     cellInfo.soruNo = word.id;
                }
                
                gridMap[coordY][coordX] = cellInfo;
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

            if (cellData === 0) {
                // Boş/Kullanılmayan hücre
                cell.classList.add('black-cell');
            } else {
                // Harf içeren hücre
                const input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.x = x;
                input.dataset.y = y;
                // Kesişen kelimeler için tüm ID'leri kaydet
                input.dataset.wordIds = cellData.wordIDs.join(',');
                
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
function setupInteraction() {
    
    // Kelimeleri ID'ye göre hızlı erişim için haritala
    const wordMap = puzzleData.kelimeler.reduce((acc, word) => {
        acc[word.id] = word;
        return acc;
    }, {});


    // Hücreye tıklandığında/odaklanıldığında yönü belirler ve vurgular
    function highlightWord(targetInput) {
        // Tüm vurguları kaldır
        document.querySelectorAll('.focused-cell').forEach(c => c.classList.remove('focused-cell'));

        const { x, y, wordIds } = targetInput.dataset;
        const xNum = parseInt(x);
        const yNum = parseInt(y);
        
        // Bu hücrenin ait olduğu kelimeleri bul
        const relevantWordIDs = wordIds.split(',').map(id => parseInt(id));
        
        // Şu anki yöne uyan kelimeyi bul
        const primaryWord = relevantWordIDs
            .map(id => wordMap[id])
            .find(w => {
                // Kelimenin, tıklanan hücreyi içerip içermediğini kontrol et
                const startX = w.baslangic_x - 1;
                const startY = w.baslangic_y - 1;
                const length = w.cevap.length;
                
                if (w.yon === currentDirection) {
                    if (w.yon === 'yatay' && startY === yNum && xNum >= startX && xNum < startX + length) {
                        return true;
                    }
                    if (w.yon === 'dikey' && startX === xNum && yNum >= startY && yNum < startY + length) {
                        return true;
                    }
                }
                return false;
            }) || wordMap[relevantWordIDs[0]]; // Bulamazsa ilk kelimeyi seç

        if (!primaryWord) return;

        // Vurgulanacak hücreleri bul ve vurgula
        const startX = primaryWord.baslangic_x - 1;
        const startY = primaryWord.baslangic_y - 1;
        const length = primaryWord.cevap.length;

        for (let i = 0; i < length; i++) {
            let cellX, cellY;
            if (primaryWord.yon === 'yatay') {
                cellX = startX + i;
                cellY = startY;
            } else {
                cellX = startX;
                cellY = startY + i;
            }
            const cell = document.querySelector(`.cell[data-x='${cellX}'][data-y='${cellY}']`);
            if (cell) {
                cell.classList.add('focused-cell');
            }
        }
    }


    gridElement.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT') {
            highlightWord(e.target);
        }
    });
    
    // Tıklamada yön değiştirme
    gridElement.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') {
            currentDirection = currentDirection === 'yatay' ? 'dikey' : 'yatay';
            highlightWord(e.target);
            e.target.focus();
        }
    });


    gridElement.addEventListener('input', (e) => {
        const input = e.target;
        if (input.tagName !== 'INPUT' || input.value.length === 0) return;

        const { x, y, wordIds } = input.dataset;
        const xNum = parseInt(x);
        const yNum = parseInt(y);
        
        const relevantWordIDs = wordIds.split(',').map(id => parseInt(id));
        const primaryWord = relevantWordIDs
            .map(id => wordMap[id])
            .find(w => w.yon === currentDirection) || wordMap[relevantWordIDs[0]];
        
        if (!primaryWord) return;

        let nextX = xNum;
        let nextY = yNum;

        if (primaryWord.yon === 'yatay') {
            nextX += 1; // Sağa ilerle
        } else {
            nextY += 1; // Aşağı ilerle
        }

        // Bir sonraki hücreyi bul (Sadece INPUT olanları ararız)
        const nextInput = document.querySelector(`input[data-x='${nextX}'][data-y='${nextY}']`);

        if (nextInput) {
            nextInput.focus();
            highlightWord(nextInput);
        } else {
             // Kelime bitti, tekrar vurgula
             highlightWord(input);
        } 
    });
}

// 3. Soruları Listeleme
function listClues() {
    const yatayList = document.getElementById('yatay-sorular');
    const dikeyList = document.getElementById('dikey-sorular');
    yatayList.innerHTML = '';
    dikeyList.innerHTML = '';

    const sortedKelimeler = puzzleData.kelimeler.sort((a, b) => a.id - b.id);
    
    sortedKelimeler.forEach(word => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${word.id}.</strong> ${word.soru}`;
        listItem.dataset.wordId = word.id;
        
        // Soruya tıklanınca ilgili kelimenin ilk harfine odaklan
        listItem.addEventListener('click', () => {
            const startX = word.baslangic_x - 1;
            const startY = word.baslangic_y - 1;
            
            // Yönü, kelimenin yönüne çevir
            currentDirection = word.yon;
            
            const firstInput = document.querySelector(`input[data-x='${startX}'][data-y='${startY}']`);
            if (firstInput) {
                firstInput.focus();
                highlightWord(firstInput);
            }
        });

        if (word.yon === 'yatay') {
            yatayList.appendChild(listItem);
        } else {
            dikeyList.appendChild(listItem);
        }
    });
}

// 4. Uygulamayı Başlatma (Veriyi Çekme)
async function init() {
    try {
        // Fetch API ile veriyi çekmeyi deniyoruz
        const response = await fetch('./data.json'); 
        if (!response.ok) {
            throw new Error(`HTTP Hata: ${response.status}`);
        }
        puzzleData = await response.json();
    } catch (error) {
        console.error("Bulmaca verisi yüklenirken sorun oluştu:", error);
        gridElement.innerHTML = '<p style="color: red; padding: 20px;">Bulmaca verisi yüklenemedi. Lütfen konsolu veya sunucu dosyalarını kontrol edin.</p>';
        return; 
    }
    
    // Veri yüklendikten sonraki adımlar
    createGrid();
    listClues();
    setupInteraction();
}


// Uygulamayı Başlat
window.onload = init;
