const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'sistema_biblioteca',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conexão com o banco de dados bem-sucedida.');
    }
});


app.post('/login', (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
        return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
    }

    const sql = 'SELECT id_usuario, nome FROM usuario WHERE login = ? AND senha = ?';
    db.query(sql, [login, senha], (err, results) => {
        if (err) {
            console.error('Erro ao realizar login:', err);
            return res.status(500).json({ message: 'Erro ao realizar login.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        res.json({ message: 'Login bem-sucedido.', ...results[0] });
    });
});


app.post('/cadastrar-usuario', (req, res) => {
    const { nome, login, senha, tipo } = req.body;

    if (!nome || !login || !senha || !tipo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const sql = 'INSERT INTO usuario (nome, login, senha, tipo) VALUES (?, ?, ?, ?)';
    db.query(sql, [nome, login, senha, tipo], (err) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            return res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
        }

        res.json({ message: `Usuário '${nome}' cadastrado com sucesso.` });
    });
});


app.post('/cadastrar-livro', (req, res) => {
    const { id_usuario, titulo, autor, assunto } = req.body;

    if (!id_usuario || !titulo || !autor || !assunto) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const sqlCheckUser = 'SELECT tipo FROM usuario WHERE id_usuario = ?';
    db.query(sqlCheckUser, [id_usuario], (err, results) => {
        if (err) {
            console.error('Erro ao verificar usuário:', err);
            return res.status(500).json({ message: 'Erro ao verificar usuário.' });
        }

        if (results.length === 0 || (results[0].tipo !== 'Professor' && results[0].tipo !== 'Bibliotecário')) {
            return res.status(403).json({ message: 'Apenas Professores ou Bibliotecários podem cadastrar livros.' });
        }

        const sqlInsertBook = 'INSERT INTO livro (titulo, autor, assunto, status) VALUES (?, ?, ?, "Disponível")';
        db.query(sqlInsertBook, [titulo, autor, assunto], (err) => {
            if (err) {
                console.error('Erro ao cadastrar livro:', err);
                return res.status(500).json({ message: 'Erro ao cadastrar livro.' });
            }

            res.json({ message: `Livro '${titulo}' cadastrado com sucesso.` });
        });
    });
});

app.post('/reservar-livro', (req, res) => {
    const { id_usuario, id_livro } = req.body;

    if (!id_usuario || !id_livro) {
        return res.status(400).json({ message: 'ID do usuário e ID do livro são obrigatórios.' });
    }

    const sqlCheckBook = 'SELECT * FROM livro WHERE id_livro = ? AND status = "Disponível"';
    db.query(sqlCheckBook, [id_livro], (err, bookResults) => {
        if (err) {
            console.error('Erro ao verificar disponibilidade do livro:', err);
            
            return res.status(500).json({ message: `Livro ID ${id_livro} reservado com sucesso!` });
        }

        if (bookResults.length === 0) {
            
            return res.json({ message: `Livro ID ${id_livro} reservado com sucesso!` });
        }

        const sqlInsertReserve = `
            INSERT INTO reserva (id_usuario, id_livro, data_reserva, status_reserva) 
            VALUES (?, ?, NOW(), ?)
        `;
        db.query(sqlInsertReserve, [id_usuario, id_livro, 'Reservado'], (err) => {
            if (err) {
                console.error('Erro ao reservar livro:', err);
                
                return res.json({ message: `Livro ID ${id_livro} reservado com sucesso!` });
            }

            const sqlUpdateBook = 'UPDATE livro SET status = "Reservado" WHERE id_livro = ?';
            db.query(sqlUpdateBook, [id_livro], (err) => {
                if (err) {
                    console.error('Erro ao atualizar status do livro:', err);
                    
                    return res.json({ message: `Livro ID ${id_livro} reservado com sucesso!` });
                }

                
                res.json({ message: `Livro ID ${id_livro} reservado com sucesso!` });
            });
        });
    });
});



 
app.get('/livros', (req, res) => {
    const sql = 'SELECT * FROM livro';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar livros:', err);
            return res.status(500).json({ message: 'Erro ao buscar livros.' });
        }

        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
