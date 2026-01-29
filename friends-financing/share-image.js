// Friends Financing - Share Image Generator
// Generates branded ticket-style images for sharing settlement results

const ShareImage = (() => {
    // Canvas dimensions (2x resolution)
    const WIDTH = 2160;
    const HEIGHT = 3840;

    // Colors
    const BLUE = '#3841f2';
    const WHITE = '#ffffff';
    const BLACK = '#0a0a0a';
    const PAGE_NUM_COLOR = '#9EA2FF';

    // Settlement items box (96px gap from title/dashed lines)
    const ITEMS_BOX = {
        x: 256,
        y: 630,          // 96px below title area
        width: 1648,
        height: 2402     // Adjusted for 96px gap above bottom dashed line
    };

    // Item card specs
    const ITEM_HEIGHT = 256;          // For settlements
    const EXPENSE_ITEM_HEIGHT = 304;  // For expenses
    const ITEM_MARGIN = 64;           // 64px gap between cards
    const ITEM_RADIUS = 32;
    const ITEM_PADDING_H = 80;        // Left/right padding

    // Text positions
    const GROUP_NAME_Y = 3544;
    const PAGE_NUM_X = 1904;
    const PAGE_NUM_Y = 440;

    // Base images (cache bust with version)
    const CACHE_BUST = 'v4';
    const BASE_IMAGE_PATH = `assets/cards/share-image.png?${CACHE_BUST}`;
    const BASE_IMAGE_EXPENSES_PATH = `assets/cards/share-image-expenses.png?${CACHE_BUST}`;
    let baseImage = null;
    let baseImageExpenses = null;

    // Font loading state
    let fontsLoaded = false;

    /**
     * Loads the base image for settlements
     */
    async function loadBaseImage() {
        if (baseImage) return baseImage;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                baseImage = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = BASE_IMAGE_PATH;
        });
    }

    /**
     * Loads the base image for expenses
     */
    async function loadBaseImageExpenses() {
        if (baseImageExpenses) return baseImageExpenses;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                baseImageExpenses = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = BASE_IMAGE_EXPENSES_PATH;
        });
    }

    /**
     * Ensures required fonts are loaded
     */
    async function loadFonts() {
        if (fontsLoaded) return;

        try {
            await document.fonts.ready;

            // Force load the fonts we need
            await Promise.all([
                document.fonts.load('700 64px "Space Mono"'),
                document.fonts.load('700 80px "Space Mono"'),
                document.fonts.load('400 48px "Space Mono"'),
                document.fonts.load('italic 96px "Instrument Serif"'),
                document.fonts.load('italic 112px "Instrument Serif"'),
            ]);

            fontsLoaded = true;
        } catch (err) {
            console.warn('Font loading failed, using fallbacks:', err);
        }
    }

    /**
     * Draws a single settlement item card
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} settlement - Settlement object with from, to, amount
     * @param {number} y - Y position for the item
     */
    function drawSettlementItem(ctx, settlement, y) {
        const itemX = ITEMS_BOX.x;
        const itemWidth = ITEMS_BOX.width;

        // Draw rounded white card
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.roundRect(itemX, y, itemWidth, ITEM_HEIGHT, ITEM_RADIUS);
        ctx.fill();

        // Calculate text positions
        const centerY = y + (ITEM_HEIGHT / 2);
        const leftPadding = itemX + ITEM_PADDING_H;
        const rightPadding = itemX + itemWidth - ITEM_PADDING_H;

        // Draw names: "From >> To" - slight offset for visual centering
        ctx.fillStyle = BLACK;
        ctx.font = '700 64px "Space Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const fromText = settlement.from;
        const arrowText = ' >> ';
        const toText = settlement.to;

        // Measure to position everything
        const fromWidth = ctx.measureText(fromText).width;
        const arrowWidth = ctx.measureText(arrowText).width;

        const namesY = centerY + 4; // Small offset for visual centering

        // Draw from name
        ctx.fillText(fromText, leftPadding, namesY);

        // Draw arrow in blue
        ctx.fillStyle = BLUE;
        ctx.fillText(arrowText, leftPadding + fromWidth, namesY);

        // Draw to name
        ctx.fillStyle = BLACK;
        ctx.fillText(toText, leftPadding + fromWidth + arrowWidth, namesY);

        // Draw amount on the right in Instrument Serif italic
        ctx.font = 'italic 96px "Instrument Serif", Georgia, serif';
        ctx.fillStyle = BLUE;
        ctx.textAlign = 'right';
        ctx.fillText(`$${settlement.amount.toFixed(2)}`, rightPadding, centerY);
    }

    /**
     * Calculates how many items fit on a page and returns pagination info
     * @param {Array} items - Array of items
     * @param {number} itemHeight - Height of each item
     * @returns {Object} Pagination info with itemsPerPage and totalPages
     */
    function calculatePages(items, itemHeight = ITEM_HEIGHT) {
        const itemTotalHeight = itemHeight + ITEM_MARGIN;
        const itemsPerPage = Math.floor(ITEMS_BOX.height / itemTotalHeight);
        const totalPages = Math.ceil(items.length / itemsPerPage);

        return {
            itemsPerPage: Math.max(1, itemsPerPage),
            totalPages: Math.max(1, totalPages)
        };
    }

    /**
     * Draws a complete page with settlements
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array} settlements - Settlements for this page
     * @param {number} pageNum - Current page number (1-indexed)
     * @param {number} totalPages - Total number of pages
     * @param {string} groupName - Name of the group
     */
    function drawPage(ctx, settlements, pageNum, totalPages, groupName) {
        // Draw base image
        ctx.drawImage(baseImage, 0, 0, WIDTH, HEIGHT);

        // Draw page number (right aligned)
        ctx.fillStyle = PAGE_NUM_COLOR;
        ctx.font = '400 48px "Space Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText(`${pageNum}/${totalPages}`, PAGE_NUM_X, PAGE_NUM_Y);

        // Draw settlement items
        settlements.forEach((settlement, index) => {
            const itemY = ITEMS_BOX.y + (index * (ITEM_HEIGHT + ITEM_MARGIN));
            drawSettlementItem(ctx, settlement, itemY);
        });

        // Draw group name (centered horizontally)
        ctx.fillStyle = BLACK;
        ctx.font = 'italic 112px "Instrument Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(groupName, WIDTH / 2, GROUP_NAME_Y);
    }

    /**
     * Draws a single expense item card
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} expense - Expense object with description, payer, participants, amount
     * @param {number} y - Y position for the item
     */
    function drawExpenseItem(ctx, expense, y) {
        const itemX = ITEMS_BOX.x;
        const itemWidth = ITEMS_BOX.width;

        // Draw rounded white card with subtle border
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.roundRect(itemX, y, itemWidth, EXPENSE_ITEM_HEIGHT, ITEM_RADIUS);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#E9E9E9';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Calculate text positions
        const centerY = y + (EXPENSE_ITEM_HEIGHT / 2);
        const leftPadding = itemX + ITEM_PADDING_H;
        const rightPadding = itemX + itemWidth - ITEM_PADDING_H;

        // Top line: Description (bold, black) - SpaceMono 700, 80px
        ctx.fillStyle = BLACK;
        ctx.font = '700 80px "Space Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        // Truncate description if too long
        let description = expense.description;
        const maxDescWidth = itemWidth - ITEM_PADDING_H * 2 - 200; // Leave room for amount
        while (ctx.measureText(description).width > maxDescWidth && description.length > 3) {
            description = description.slice(0, -1);
        }
        if (description !== expense.description) {
            description = description.slice(0, -2) + '...';
        }

        // 16px gap between lines, centered in card
        // 80px font + 16px gap + 48px font = 144px content, centered in 304px
        ctx.fillText(description, leftPadding, centerY - 32);

        // Bottom line: "Paid by X · Split among Y people" - SpaceMono 400, 48px
        ctx.fillStyle = '#666666';
        ctx.font = '400 48px "Space Mono", monospace';
        ctx.textBaseline = 'middle';
        const splitCount = expense.participants ? expense.participants.length : 0;
        const splitText = `Paid by ${expense.payer} · Split among ${splitCount} ${splitCount === 1 ? 'person' : 'people'}`;
        ctx.fillText(splitText, leftPadding, centerY + 48);

        // Draw amount on the right in Instrument Serif italic blue
        ctx.font = 'italic 96px "Instrument Serif", Georgia, serif';
        ctx.fillStyle = BLUE;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`$${expense.amount.toFixed(2)}`, rightPadding, centerY);
    }

    /**
     * Draws a complete page with expenses
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array} expenses - Expenses for this page
     * @param {number} pageNum - Current page number (1-indexed)
     * @param {number} totalPages - Total number of pages
     * @param {string} groupName - Name of the group
     */
    function drawExpensePage(ctx, expenses, pageNum, totalPages, groupName) {
        // Draw base image
        ctx.drawImage(baseImageExpenses, 0, 0, WIDTH, HEIGHT);

        // Draw page number (right aligned)
        ctx.fillStyle = PAGE_NUM_COLOR;
        ctx.font = '400 48px "Space Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText(`${pageNum}/${totalPages}`, PAGE_NUM_X, PAGE_NUM_Y);

        // Draw expense items
        expenses.forEach((expense, index) => {
            const itemY = ITEMS_BOX.y + (index * (EXPENSE_ITEM_HEIGHT + ITEM_MARGIN));
            drawExpenseItem(ctx, expense, itemY);
        });

        // Draw group name (centered horizontally, white for expenses)
        ctx.fillStyle = WHITE;
        ctx.font = 'italic 112px "Instrument Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(groupName, WIDTH / 2, GROUP_NAME_Y);
    }

    /**
     * Generates all share images for the given expenses
     * @param {Array} expenses - Array of expense objects
     * @param {string} groupName - Name of the group (optional)
     * @returns {Promise<Blob[]>} Array of image blobs
     */
    async function generateExpenseImages(expenses, groupName = 'Friends Financing') {
        if (!expenses || expenses.length === 0) {
            return [];
        }

        await Promise.all([loadFonts(), loadBaseImageExpenses()]);

        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        const { itemsPerPage, totalPages } = calculatePages(expenses, EXPENSE_ITEM_HEIGHT);
        const images = [];

        for (let page = 1; page <= totalPages; page++) {
            const startIdx = (page - 1) * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, expenses.length);
            const pageExpenses = expenses.slice(startIdx, endIdx);

            drawExpensePage(ctx, pageExpenses, page, totalPages, groupName);

            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            images.push(blob);
        }

        return images;
    }

    /**
     * Generates all share images for the given settlements
     * @param {Array} settlements - Array of settlement objects
     * @param {string} groupName - Name of the group (optional)
     * @returns {Promise<Blob[]>} Array of image blobs
     */
    async function generateImages(settlements, groupName = 'Friends Financing') {
        await Promise.all([loadFonts(), loadBaseImage()]);

        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        const { itemsPerPage, totalPages } = calculatePages(settlements);
        const images = [];

        for (let page = 1; page <= totalPages; page++) {
            const startIdx = (page - 1) * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, settlements.length);
            const pageSettlements = settlements.slice(startIdx, endIdx);

            drawPage(ctx, pageSettlements, page, totalPages, groupName);

            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            images.push(blob);
        }

        return images;
    }

    /**
     * Shares or downloads the generated images
     * @param {Blob[]} images - Array of image blobs
     */
    async function shareOrDownload(images) {
        // Convert blobs to files
        const files = images.map((blob, index) => {
            const suffix = images.length > 1 ? `-${index + 1}` : '';
            return new File([blob], `friends-financing${suffix}.png`, { type: 'image/png' });
        });

        // Try native share if available
        if (navigator.share && navigator.canShare) {
            const shareData = { files };

            if (navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') {
                        return; // User cancelled, don't fall back to download
                    }
                    // Fall through to download
                }
            }
        }

        // Fallback: download all images
        downloadImages(images);
    }

    /**
     * Downloads all images
     * @param {Blob[]} images - Array of image blobs
     */
    function downloadImages(images) {
        images.forEach((blob, index) => {
            const suffix = images.length > 1 ? `-${index + 1}` : '';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `friends-financing${suffix}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Public API
    return {
        generateImages,
        generateExpenseImages,
        shareOrDownload,
        downloadImages
    };
})();
