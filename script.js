// data.json içeriğini doğrudan global bir değişkene atayacağız (basitlik için)
// Normalde bu bir fetch isteği ile yapılmalıdır.

// Varsayım: JSON içeriği data değişkeninde mevcut (index.html'deki script src ile)
const data = {
    // data.json içeriği burada olmalı
    "boyut": 10,
    "kelimeler": [
        // ... kelime objeleri
    ]
}; 

const gridElement = document.getElementById('crossword-grid');
const boyut = data.boyut;

// 1. Izgarayı Oluşturma
function createGrid() {
    gridElement.style.gridTemplateColumns = `repeat(${boyut}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${boyut}, 1fr)`;

    // Harita oluşturma (boş hücreler ve kelime ID'leri)
    const gridMap = Array(boyut).fill(0).map(() => Array(boyut).fill({ type: 'empty' }));

    // Kelimeleri haritaya yerleştirme
    data.kelimeler.forEach(word => {
        let x = word.baslangic_x - 1;
        let y = word.baslangic_y - 1;

        for (let i = 0; i < word.cevap.length; i++) {
            const index = word.yon === 'yatay' ? x + i : y + i;
            const coordX = word.yon === 'yatay' ? index : x;
            const coordY = word.yon === 'yatay' ? y : index;

            // Hücre objesini güncelle
            gridMap[coordY][coordX] = {
                type: 'letter',
                kelimeID: word.id,
                harfIndex: i,
                soruNo: i === 0 ? word.id : null,
                dogruHarf: word.cevap[i]
            };
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
                // Bulmacada hiç kullanılmayan boş hücreleri siyah yap (Çengel Bulmaca standardı)
                cell.classList.add('black-cell');
            } else {
                const input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.wordId = cellData.kelimeID;
                input.dataset.charIndex = cellData.harfIndex;
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
function setupInteraction() {
    gridElement.addEventListener('input', (e) => {
        const input = e.target;
        if (input.tagName !== 'INPUT') return;

        const { wordId, charIndex, x, y } = input.dataset;
        const currentWord = data.kelimeler.find(w => w.id === parseInt(wordId));
        
        if (!currentWord) return;

        // Otomatik İlerleme Mantığı
        let nextX = parseInt(x);
        let nextY = parseInt(y);

        if (currentWord.yon === 'yatay') {
            nextX += 1; // Sağa ilerle
        } else {
            nextY += 1; // Aşağı ilerle
        }

        // Bir sonraki hücreyi bul
        const nextCell = document.querySelector(`input[data-x='${nextX}'][data-y='${nextY}']`);

        if (nextCell) {
            nextCell.focus();
        } 
        // OPTIONAL: Kelime bittiğinde kontrol edilebilir veya başka bir kelimenin ilk hücresine odaklanılabilir.
    });

    // OPTIONAL: Ok tuşları ile gezme ve tıklamada kelime yönünü belirleme eklenebilir.
}

// 3. Soruları Listeleme
function listClues() {
    const yatayList = document.getElementById('yatay-sorular');
    const dikeyList = document.getElementById('dikey-sorular');

    data.kelimeler.forEach(word => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${word.id}.</strong> ${word.soru}`;
        
        if (word.yon === 'yatay') {
            yatayList.appendChild(listItem);
        } else {
            dikeyList.appendChild(listItem);
        }
    });
}


// Uygulamayı Başlatma
window.onload = () => {
    // NOT: data.json dosyasının doğru yüklenmesi için 
    // yerel çalıştırma veya basit bir sunucu kullanmak gerekebilir.
    // Şimdilik varsayarak devam ediyoruz.
    
    createGrid();
    listClues();
    setupInteraction();
};
