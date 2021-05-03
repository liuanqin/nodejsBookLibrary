const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']
// const upload = multer({
//     dest: uploadPath,
//     fileFilter: (req, file, callback) => {
//         callback(null, imageMimeTypes.includes(file.mimetype))
//     }
// })

// All Books
router.get('/', async (req, res) => {
    let query = Book.find()
      if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
      }
      if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishDate', req.query.publishedBefore)
      }
      if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.gte('publishDate', req.query.publishedAfter)
      }
    try {
        const books = await query.exec()
        res.render('books/index', {
            books: books,
            searchOptions: req.query
    })
} catch {
    res.redirect('/')
}})

// New book Route
router.get('/new', async (req, res) => {
    renderNewPage(res, req)
})

// create new book route  (single means uploading single file)
router.post('/', async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book ({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    })
    saveCover(book, req.body.cover)
    try {
        const newBook = await book.save()
        res.redirect(`books/${newBook.id}`)
    } catch(e) {
        console.error(e)
        renderNewPage(res, book, true)
    }
})


function saveCover (book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if(cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

// show book route
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author').exec()
        res.render('books/show', {book: book})
    } catch {
        res.redirect('/')
    }
})

// edit book route
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        renderEditPage(res, book)
    } catch {
        res.redirect('/')
    }
})

//update book route
router.put('/:id', async (req, res) => {

    let book
    try {
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = new Date(req.body.publishDate)
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if (req.body.cover != null && req.body.cover != '') {
            saveCover(book, req.body.cover)
        }
        await book.save()
        res.redirect(`/books/${book.id}`)
    } catch(e) {
        console.error(e)
        if(book != null) {
            renderEditPage(res, book, true)
        } else {
            redirect('/')
        }
    }
})

// delete book page
router.delete('/:id', async (req, res) => {
    let book
    try {
        book = await Book.findById(req.params.id)
        await book.remove()
        res.redirect('/books')
    } catch {
        if (book != null) {
            res.render('books/show', {
                book: book,
                errorMessage: "failed deleting"
            })
        } else {
            res.redirect('/')
        }
    }
})

async function renderNewPage (res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const parames = {
            authors: authors,
            book: book
        }
        if (hasError) parames.errorMessage = 'Error Creating Book'
        res.render('books/new', parames)
    } catch {
        res.redirect('books')
    }
}

async function renderEditPage (res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const parames = {
            authors: authors,
            book: book
        }
        if (hasError) parames.errorMessage = 'Error Creating Book'
        res.render('books/edit', parames)
    } catch {
        res.redirect('books')
    }
}

module.exports = router
