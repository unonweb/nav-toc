import Sticky from '../../commons/sticky/Sticky.js'

export default class NavToc extends HTMLElement {
	/*
		@Attributes:
			[data-insert] 	// append, prepend, replace
			[data-src] 		// <id> of element containing the content
			[data-levels] 	// 1,2,3,4
			[data-dest] 	// <selector>
	*/

	static translate(key) {
		let lang = (document.documentElement.lang !== '') ? document.documentElement.lang : 'de'
		if (!this.dictionary[key]) {
			return 'undefined'
		}
		return this.dictionary[key][lang]
	}

	static dictionary = {
		'toc': {
			de: 'Inhaltsverzeichnis',
			en: 'Table Of Contents'
		},
	}

	_defaults = {
		dest: 'toc-content'
	}

	_log = true
	_src // src element
	_dest // dest element

	constructor() {
		super()
	}

	connectedCallback() {
		// init
		this.role ??= 'navigation'
		this.ariaLabel = NavToc.translate('toc')
		this.dataset.levels ??= 'H1,H2' // no whitespace!
		this.dataset.dest ??= this._defaults.dest

		if (this.dataset.sticky) {
			new Sticky(this)
		}

		this._getElements()
		this._render()
	}

	_getElements() {
		this._src = document.getElementById(this.dataset.src)
		this._dest = this.querySelector(this.dataset.dest) ?? this
	}

	_render() {
		let ul = this._createStaticList(this._src, this.dataset.levels)
		switch (this.dataset.insert) {
			case 'replace':
				this._dest.replaceChildren(ul)
				break
			case 'append':
				this._dest.append(ul)
				break
			case 'prepend':
				this._dest.prepend(ul)
				break
			default:
				this._dest.append(ul)
		}
	}

	_createStaticList(article, levels) {
		/*
			@Args
				levels: '1,2,3'
			@Task
				Return a <ul> with table of contents
		*/

		if (!article) {
			throw new Error('article: ', article)
		}

		levels = levels.replace(' ', '').split(',') // --> ['1','2','3']
		let headingSelectors = levels.map(lvl => `H${lvl}`) // [1,2,3] --> ['H1','H2','H3']

		// loop through headings
		const headings = article.querySelectorAll(headingSelectors)
		let list = document.createElement('ul')
		list.className = 'content'
		let lastLevel = levels[0]
		let depthCounter = 0

		for (let i = 0; i < headings.length; i++) {
			const heading = headings[i]
			// * make sure all headers have an id
			// * create anchors and list items 
			let id

			// heading
			let lvl = parseInt(heading.tagName[1]) // H1 --> 1 (extract humber from tagName)
			heading.dataset.lvl = lvl
			if (heading.id) {
				id = heading.id
			}
			else {
				id = `h${lvl}-${i}` // lvl1-h1 (tag heading with a a unique id)
				heading.id = id
			}

			// anchor
			const anchor = document.createElement('a')
			anchor.href = `#${id}`
			anchor.textContent = heading.textContent
			anchor.addEventListener('click', evt => this._onClickAnchor(evt, id))

			// li
			const li = document.createElement('li')
			li.append(anchor)
			li.dataset.lvl = lvl

			// ul
			if (lvl > lastLevel) {
				// More indentation, make a new list per lvl
				for (let i = 0; i < lvl - lastLevel; ++i) {
					if (this._log) console.log('create new ul lvl: ', lvl)
					const childList = document.createElement('ul')
					childList.className = `lvl-${lvl}`
					list.append(childList)
					list = childList
					depthCounter++
				}
			}
			else if (lvl < lastLevel) {
				// Less indentation, move back a few levels
				for (let i = 0; i < lastLevel - lvl; ++i) {
					list = list.parentNode
					depthCounter--
				}
			}

			list.append(li)
			lastLevel = lvl

			if (i === headings.length - 1) {
				// At the end go back until start lvl
				while (depthCounter > 0) {
					list = list.parentNode
					depthCounter--
				}
			}
		}

		return list
	}

	_onClickAnchor(evt, destID) {
		// @click
		evt.preventDefault()
		const dest = document.getElementById(destID)
		this._scrollTo(dest)

		/* if (dest.dataset.state === 'collapsed') {
			dest.dataset.state = 'expanded'
		} */

	}

	_scrollTo(dest) {
		const isInViewport = this._isInViewport(dest)
		const scrolledClass = 'scrolledTo'
		dest.classList.toggle(scrolledClass, false) // toggle = false: token will only be removed, but not added
		dest.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
		// block: Defines vertical alignment. One of start, center, end, or nearest.
		// inline: Defines horizontal alignment. One of start, center, end, or nearest.


		if (isInViewport) {
			// add 'scrolledTo' immediately if no scroll happened
			dest.classList.add(scrolledClass)
		} else {
			// add 'scrolledTo' on scroll end
			document.addEventListener('scrollend', (evt) => {
				dest.classList.add(scrolledClass)
			}, { once: true, passive: true });
		}

		setTimeout(() => {
			dest.classList.remove(scrolledClass)
		}, 4000)
	}

	_isInViewport(element) {
		const rect = element.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}
}