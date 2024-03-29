document.addEventListener('readystatechange', event => { 
    if (event.target.readyState === 'interactive') {
        document.addEventListener('click', (event) => {
            if (navigation && navigation.classList.contains('show') && event.clientX > 250) toggleMobileNavigationMenu();
            if (!event.target.parentNode.classList || !event.target.parentNode.classList.contains('dropdown')) hideAllDropdowns();
        });
        window.addEventListener('resize', (event) => {
            if (navigation && navigation.classList.contains('show')) toggleMobileNavigationMenu();
            hideAllDropdowns();
        });
        onLoad(document);
    }
});

let loaded = false;
let submitions = [];

function onLoad(root) {
    for (const element of root.getElementsByTagName('*')) {
        if (element.classList.contains('table-of-contents')) addOnPostLoad(() => { element.innerHTML = '';  generateTableOfContents(element) });
        else if (!menu && element.classList.contains('menu')) menu = element;
        else if (!navigation && element.classList.contains('navigation')) navigation = element;
        else if (!navigationContent && element.classList.contains('navigation-content')) navigationContent = element;
        else if (element.nodeName == 'H2' && element.id != '') headlines.push(element);
        else if (element.classList.contains('dropdown')) initializeDropdown(element);
        else if (element.classList.contains('input')) initializeInputObject(element);
        else if (element.classList.contains('input-buttons')) initializeInputButtons(element);
        else if (element.nodeName == 'CODE') {
            if (element.classList.contains("html")) highlightHtml(element);
            else if (element.classList.contains("css")) highlightCss(element);
        }
        if (element.nodeName === 'INPUT') initializeInput(element);
        if (element.hasAttribute('include')) include(element, element.getAttribute('include'));
        else if (element.hasAttribute('replace')) replace(element, element.getAttribute('replace'));
    }
    initializeNavigation();
    loaded = true;
    for (let submition of submitions) submition.call();
}

function addOnPostLoad(submission) {
    submitions.push(submission);
}

// *********************
// * Include Replace   *
// *********************

function include(element, src) {
    fetch(src).then(response => response.text()).then(text => element.innerHTML = text).then(text => onLoad(element));
}

function replace(element, src) {
    fetch(src).then(response => response.text()).then(text => element.innerHTML = text).then(text => onLoad(element)).then(text => {
        for (const child of element.children) {
            element.after(child);
        }
        element.remove();
    });
}

function expose(id) {
    const element = document.getElementById(id);
    if (!element.classList.contains('hide')) return;
    element.classList.remove('hide');
    element.innerHTML = element.innerHTML.replace('<!--', '').replace('-->', '');
    onLoad(element);
}

function cover(id) {
    const element = document.getElementById(id);
    if (element.classList.contains('hide')) return;
    element.classList.add('hide');
    element.innerHTML = '<!--' + element.innerHTML + '-->';
}

function toggle(id) {
    const element = document.getElementById(id);
    if (element.classList.contains('hide')) expose(id)
    else cover(id);
}

// *********************
// * Table of Contents *
// *********************

function generateTableOfContents(element) {
    for (let headline of headlines) {
        const link = document.createElement('a');
        link.href = '#' + headline.id;
        link.innerText = headline.innerText;
        link.addEventListener('click', () => toggleMobileNavigationMenu());
        element.appendChild(link);
    }
}

// *********************
// * Menu              *
// *********************

let menu;

function setMenuFocus(string) {
    if (!loaded) {
        submitions.push(() => setMenuFocus(string));
        return;
    }
    if (string == undefined || string == '' || !menu) return;
    for (let element of menu.getElementsByTagName('A')) {
        if (element.innerText == string) element.classList.add('menu-active');
        else element.classList.remove('menu-active');
    }
    if (!mobileNavigationMenu) return;
    for (let element of mobileNavigationMenu.getElementsByTagName('A')) {
        if (element.innerText == string) element.classList.add('menu-active');
        else element.classList.remove('menu-active');
    }
}

// *********************
// * Navigation        *
// *********************

let navigation;
let mobileNavigationMenu;
let navigationContent;
let headlines = [];

function initializeNavigation() {
    if (!navigation && menu && menu.classList.contains('mobile-menu')) {
        navigation = document.createElement('div');
        navigation.classList.add('navigation');
        navigation.classList.add('only-mobile');
        document.body.insertBefore(navigation, menu ? menu.nextElementSibling : document.body.firstChild);
    }
    if (navigation && !navigationContent) navigationContent = navigation.nextElementSibling;
    if (menu && menu.classList.contains('mobile-menu') && navigation) {
        if (navigation.getElementsByClassName('mobile-navigation')[0]) {
            mobileNavigationMenu = navigation.getElementsByClassName('mobile-navigation')[0];
        } else {
            mobileNavigationMenu = document.createElement('div');
            mobileNavigationMenu.classList.add('mobile-navigation');
            if (navigation.children.length == 0) navigation.appendChild(mobileNavigationMenu);
            else navigation.insertBefore(mobileNavigationMenu, navigation.children[0]);
        }
        mobileNavigationMenu.classList.add('only-mobile');
        mobileNavigationMenu.innerHTML = '';
        for (let element of menu.children) {
            if (element.nodeName != 'A' || element.classList.contains('not-mobile') || element.classList.contains('menu-title')) continue;
            const menuItem = element.cloneNode(true);
            menuItem.addEventListener('click', () => toggleMobileNavigationMenu());
            mobileNavigationMenu.appendChild(menuItem);
            element.classList.add('not-mobile');
        }
    }
}

function setNavigationFocus(string) {
    if (!loaded) {
        submitions.push(() => setNavigationFocus(string));
        return;
    }
    if (string == undefined || string == '' || !navigation) return;
    for (let element of navigation.getElementsByTagName('A')) {
        if (element.parentElement.classList.contains('navigation-menu')) continue;
        if (element.innerText == string) element.classList.add('navigation-active');
        else element.classList.remove('menu-active');
    }
}

function toggleMobileNavigationMenu() {
    if (window.innerWidth > 768 || !mobileNavigationMenu) return;
    if (!navigation.classList.contains('show')) {
        navigation.classList.add('show');
        if (navigationContent) navigationContent.classList.add('navigation-content-hide');
    } else {
        if (navigationContent) navigationContent.classList.remove('navigation-content-hide');
        navigation.classList.remove('show');
    }
}

// *********************
// * Input             *
// *********************

function initializeInput(input) {
    input.addEventListener('input', event => input.setAttribute('dirty', ''));
    input.addEventListener('focusout', event => {
        if (input.value !== 0 && input.value !== '') input.setAttribute('dirty', '');
    });
}

function initializeInputObject(input) {
    let inputField = input.getElementsByTagName('input')[0];
    if (!inputField) inputField = input.getElementsByTagName('textarea')[0];
    if (!inputField) return;
    const inputError = input.getElementsByClassName('input-error')[0]
    const inputRange = input.getElementsByClassName('input-range')[0];
    if (inputRange) {
        const attribute = inputField.getAttribute('maxlength');
        inputRange.innerText = inputField.value.length + (attribute ? '/' + attribute : '');
        inputField.addEventListener('input', event => inputRange.innerText = event.target.value.length + (attribute ? '/' + attribute : ''));
    }
    if (inputError) {
        inputError.innerText = inputField.validationMessage;
        inputField.addEventListener('input', event => inputError.innerText = inputField.validationMessage);
    }
}

function initializeInputButtons(input) {
    const inputField = input.getElementsByTagName('input')[0];
    if (!inputField) return;
    const buttons = input.getElementsByTagName('a');
    inputField.addEventListener('focus', event => Array.from(buttons).forEach(button => button.classList.add('active')));
    inputField.addEventListener('focusout', event => Array.from(buttons).forEach(button => button.classList.remove('active')));
}

function incrementInput(element) {
    const input = element.parentElement.getElementsByTagName('input')[0];
    if (!input || !(!input.hasAttribute('max') || input.getAttribute('max') > input.value)) return;
    input.value++;
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

function decrementInput(element) {
    const input = element.parentElement.getElementsByTagName('input')[0];
    if (!input || !(!input.hasAttribute('min') || input.getAttribute('min') < input.value)) return;
    input.value--;
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

// *********************
// * Dropdown          *
// *********************

let dropdowns = [];

function initializeDropdown(dropdown) {
    const content = dropdown.getElementsByClassName('dropdown-content')[0];
    if (!content) return;
    if (dropdown.classList.contains('dropdown-hover')) dropdown.addEventListener('mouseover', event => translateDropdown(dropdown, content));
    dropdown.addEventListener('click', event => toggleDropdown(dropdown, content));
    dropdowns.push(dropdown);
    const input = dropdown.getElementsByTagName('input')[0];
    if (input) initializeInputDropdown(dropdown, content, input);
}

function initializeInputDropdown(dropdown, content, input) {
    const valueElements = content.getElementsByTagName('a');
    input.setAttribute("autocomplete", "off");
    let activeElement = -1;
    let visibleElemnts = [];
    input.addEventListener('click', event => {
        visibleElemnts = valueElements;
        activeElement = -1;
        for (var i = 0; i < valueElements.length; i++) valueElements[i].classList.remove('hide');
    });
    for (var i = 0; i < valueElements.length; i++) {
        if (!valueElements[i].hasAttribute('value')) valueElements[i].setAttribute('value', valueElements[i].innerHTML);
        valueElements[i].addEventListener('click', event => {
            input.value = event.target.getAttribute('value');
            event.target.classList.remove('dropdown-active');
            activeElement = -1;
        });
    }
    input.addEventListener('input', event => {
        content.classList.add('show');
        if (activeElement != -1 && visibleElemnts.length > 0) visibleElemnts[activeElement].classList.remove('dropdown-active');
        visibleElemnts = [];
        activeElement = -1;
         if (input.value == '') {
            visibleElemnts = valueElements;
            for (var i = 0; i < valueElements.length; i++) valueElements[i].classList.remove('hide');
        } else {
            for (var i = 0; i < valueElements.length; i++) {
                if (input.value.includes(valueElements[i].getAttribute('value')) || valueElements[i].getAttribute('value').includes(input.value)) {
                    valueElements[i].classList.remove('hide');
                    visibleElemnts.push(valueElements[i]);
                } else {
                    valueElements[i].classList.add('hide');
                }
            }
        }
        if (visibleElemnts.length == 0) content.classList.add('hide');
        else content.classList.remove('hide');
    });
    input.addEventListener('keydown', event => {
        if (!content.classList.contains('show')) {
            if (event.keyCode == 13) content.classList.add('show');
            return;
        }
        if ((event.keyCode == 40 || event.keyCode == 38) && visibleElemnts.length > 0) {
            event.preventDefault();
            if (activeElement == -1) {
                activeElement = event.keyCode == 40 ? 0 : visibleElemnts.length - 1;
                visibleElemnts[activeElement].classList.add('dropdown-active');
            } else {
                visibleElemnts[activeElement].classList.remove('dropdown-active');
                if (event.keyCode == 40) {
                    if (activeElement + 1 < visibleElemnts.length) activeElement++;
                    else activeElement = 0;
                } else {
                    if (activeElement - 1 >= 0) activeElement--;
                    else activeElement = visibleElemnts.length - 1;
                }
                visibleElemnts[activeElement].classList.add('dropdown-active');
            }
            const contentRect = content.getBoundingClientRect();
            const elementRect = visibleElemnts[activeElement].getBoundingClientRect();
            const elementOffset = visibleElemnts[activeElement].offsetTop;
            if (elementOffset + elementRect.height > content.scrollTop + contentRect.height) content.scrollTop = elementOffset + elementRect.height - contentRect.height;
            else if (elementOffset < content.scrollTop) content.scrollTop = elementOffset;
        } else if (event.keyCode == 13 && activeElement != -1) {
            valueElements[activeElement].click();
        }
    });
}

function toggleDropdown(dropdown, content) {
    if (!content.classList.contains('show')) {
        hideAllDropdowns();
        content.classList.add('show');
        translateDropdown(dropdown, content);
    } else {
        content.classList.remove('show');
    }
}

function hideAllDropdowns() {
    for (let element of dropdowns) {
        element.getElementsByClassName('dropdown-content')[0].classList.remove('show');
    }
}

function translateDropdown(dropdown, content) {
    const contentRect = content.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    if (contentRect.right > window.innerWidth) content.style.cssText = 'left: -' + (contentRect.width - dropdownRect.width) + 'px;';
    if (dropdown.getElementsByTagName('input')[0]) {
        if (contentRect.bottom > window.innerHeight && window.innerHeight - contentRect.top > 100) content.style.maxHeight = (window.innerHeight - contentRect.top) + 'px';
        else content.style.maxHeight = '';
    }    
}

// *********************
// * Dialog            *
// *********************

function toggleDialog(dialog) {
    if (!dialog.classList.contains('show')) {
        hideAllDropdowns();
        dialog.classList.add('show');
    } else {
        dialog.classList.remove('show');
    }
}

// *********************
// * Code Highlighting *
// *********************

function highlightHtml(element) {
    const string = element.innerHTML;
    let codeString = '';
    let tag = false;
    let attribute = false;
    let value = false;
    let comment = false;
    let lastAddedIndex = 0;
    for (let i = 0; i < string.length; i++) {
        if (!tag && i + 3 < string.length && string.substring(i, i + 4) == '&lt;' && !(i + 7 < string.length && string.substring(i, i + 7) == '&lt;!--')) {
            codeString += string.substring(lastAddedIndex, i) + '<span class="blue-text">&lt;';
            tag = true;
            i += 4;
            lastAddedIndex = i;
        } else if (tag && i + 3 < string.length && string.substring(i, i + 4) == '&gt;') {
            codeString += string.substring(lastAddedIndex, i);
            if (attribute) codeString += '</span>';
            codeString += '&gt;</span>';
            tag = false;
            attribute = false;
            i += 3;
            lastAddedIndex = i + 1;
        } else if (tag && !attribute && string.charAt(i) == ' ') {
            codeString += string.substring(lastAddedIndex, i) + '<span class="green-text">';
            attribute = true;
            lastAddedIndex = i;
        } else if (tag && attribute && string.charAt(i) == '"') {
            codeString += value ? string.substring(lastAddedIndex, i) + '"</span>' : string.substring(lastAddedIndex, i) + '<span class="red-text">"';
            value = !value;
            lastAddedIndex = i + 1;
        } else if (!tag && !comment && i + 7 < string.length && string.substring(i, i + 7) == '&lt;!--') {
            codeString += string.substring(lastAddedIndex, i) + '<span class="grey-text">&lt;!--';
            comment = true;
            i += 7;
            lastAddedIndex = i;
        } else if (comment && i + 6 < string.length && string.substring(i, i + 6) == '--&gt;') {
            codeString += string.substring(lastAddedIndex, i) + '--&gt;</span>';
            comment = false;
            i += 6;
            lastAddedIndex = i;
        }
    }
    codeString += string.substring(lastAddedIndex, string.length - 1);
    element.innerHTML = codeString;
}

function highlightCss(element) {
    const string = element.innerHTML;
    let codeString = '';
    let key = false;
    let value = false;
    let comment = false;
    let lastAddedIndex = 0;
    for (let i = 0; i < string.length; i++) {
        if (!comment && !key && string.charAt(i) == '{') {
            codeString += string.substring(lastAddedIndex, i) + '</span>{<span class="green-text">';
            key = true;
            lastAddedIndex = ++i;
        } else if (!comment && key && string.charAt(i) == ':') {
            codeString += string.substring(lastAddedIndex, i) + '</span>:<span class="red-text">';
            value = true;
            lastAddedIndex = ++i;
        } else if (!comment && key && string.charAt(i) == '}') {
            codeString += string.substring(lastAddedIndex, i) + '</span>}<span class="blue-text">';
            key = false;
            value = false;
            lastAddedIndex = ++i;
        } else if (!comment && value && string.charAt(i) == ';') {
            codeString += string.substring(lastAddedIndex, i) + '</span>;<span class="green-text">';
            key = true;
            value = false;
            lastAddedIndex = ++i;
        } else if (!comment && i + 1 < string.length && string.substring(i, i + 2) == '/*') {
            codeString += string.substring(lastAddedIndex, i) + '<span class="grey-text">/*';
            comment = true;
            i += 2;
            lastAddedIndex = i;
        } else if (comment && i + 1 < string.length && string.substring(i, i + 2) == '*/') {
            codeString += string.substring(lastAddedIndex, i) + '/*</span>';
            comment = false;
            i += 2;
            lastAddedIndex = i;
        }
    }
    codeString += string.substring(lastAddedIndex, string.length - 1);
    element.innerHTML = '<span class="blue-text">' + codeString + '</span>';
}