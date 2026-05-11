require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'minha-chave-secreta';
const SESSION_NAME = process.env.SESSION_NAME || 'whatsapp-session';

let client = null;
let qrCodeData = null;
let sessionStatus = 'DISCONNECTED';

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
    if (key !== SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized: API Key inválida' });
          }
            next();
            }

            // Inicializa sessão WPPConnect
            async function initSession() {
              console.log('Iniciando sessão WPPConnect...');
                sessionStatus = 'CONNECTING';

                  client = await wppconnect.create({
                      session: SESSION_NAME,
                          catchQR: async (base64Qr, asciiQR) => {
                                console.log('QR Code gerado. Acesse /qrcode para visualizar.');
                                      qrCodeData = base64Qr;
                                            sessionStatus = 'QRCODE';
                                                },
                                                    statusFind: (statusSession, session) => {
                                                          console.log('Status da sessão:', statusSession);
                                                                sessionStatus = statusSession;
                                                                    },
                                                                        headless: true,
                                                                            devtools: false,
                                                                                useChrome: true,
                                                                                    debug: false,
                                                                                        logQR: true,
                                                                                            browserWS: '',
                                                                                                browserArgs: [
                                                                                                      '--no-sandbox',
                                                                                                            '--disable-setuid-sandbox',
                                                                                                                  '--disable-dev-shm-usage',
                                                                                                                        '--disable-accelerated-2d-canvas',
                                                                                                                              '--no-first-run',
                                                                                                                                    '--no-zygote',
                                                                                                                                          '--disable-gpu'
                                                                                                                                              ],
                                                                                                                                                  puppeteerOptions: {},
                                                                                                                                                      disableWelcome: false,
                                                                                                                                                          updatesLog: true,
                                                                                                                                                              autoClose: 60000,
                                                                                                                                                                  tokenStore: 'file',
                                                                                                                                                                      folderNameToken: './tokens',
                                                                                                                                                                        });
                                                                                                                                                                        
                                                                                                                                                                          client.onMessage(async (message) => {
                                                                                                                                                                              console.log('Mensagem recebida de:', message.from, '| Texto:', message.body);
                                                                                                                                                                                });
                                                                                                                                                                                
                                                                                                                                                                                  sessionStatus = 'CONNECTED';
                                                                                                                                                                                    console.log('Sessão iniciada com sucesso!');
                                                                                                                                                                                    }
                                                                                                                                                                                    
                                                                                                                                                                                    // ============ ROTAS ============
                                                                                                                                                                                    
                                                                                                                                                                                    // Status da sessão
                                                                                                                                                                                    app.get('/status', authMiddleware, (req, res) => {
                                                                                                                                                                                      res.json({ status: sessionStatus });
                                                                                                                                                                                      });
                                                                                                                                                                                      
                                                                                                                                                                                      // QR Code
                                                                                                                                                                                      app.get('/qrcode', authMiddleware, async (req, res) => {
                                                                                                                                                                                        if (!qrCodeData) {
                                                                                                                                                                                            return res.status(404).json({ error: 'QR Code não disponível. Sessão já autenticada ou não iniciada.' });
                                                                                                                                                                                              }
                                                                                                                                                                                                try {
                                                                                                                                                                                                    const qrImageUrl = await qrcode.toDataURL(qrCodeData);
                                                                                                                                                                                                        res.send(`<html><body><h2>Escaneie o QR Code</h2><img src="${qrImageUrl}" /></body></html>`);
                                                                                                                                                                                                          } catch (e) {
                                                                                                                                                                                                              res.json({ qrcode: qrCodeData });
                                                                                                                                                                                                                }
                                                                                                                                                                                                                });
                                                                                                                                                                                                                
                                                                                                                                                                                                                // Enviar mensagem de texto
                                                                                                                                                                                                                app.post('/send-message', authMiddleware, async (req, res) => {
                                                                                                                                                                                                                  if (!client || sessionStatus !== 'CONNECTED') {
                                                                                                                                                                                                                      return res.status(503).json({ error: 'Sessão não conectada. Status: ' + sessionStatus });
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                          const { phone, message } = req.body;
                                                                                                                                                                                                                            if (!phone || !message) {
                                                                                                                                                                                                                                return res.status(400).json({ error: 'Campos "phone" e "message" são obrigatórios.' });
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                    try {
                                                                                                                                                                                                                                        const result = await client.sendText(`${phone}@c.us`, message);
                                                                                                                                                                                                                                            res.json({ success: true, result });
                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                  res.status(500).json({ error: err.message });
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                    // Enviar imagem por URL
                                                                                                                                                                                                                                                    app.post('/send-image', authMiddleware, async (req, res) => {
                                                                                                                                                                                                                                                      if (!client || sessionStatus !== 'CONNECTED') {
                                                                                                                                                                                                                                                          return res.status(503).json({ error: 'Sessão não conectada.' });
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                              const { phone, imageUrl, caption } = req.body;
                                                                                                                                                                                                                                                                if (!phone || !imageUrl) {
                                                                                                                                                                                                                                                                    return res.status(400).json({ error: 'Campos "phone" e "imageUrl" são obrigatórios.' });
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                        try {
                                                                                                                                                                                                                                                                            const result = await client.sendImage(`${phone}@c.us`, imageUrl, 'image', caption || '');
                                                                                                                                                                                                                                                                                res.json({ success: true, result });
                                                                                                                                                                                                                                                                                  } catch (err) {
                                                                                                                                                                                                                                                                                      res.status(500).json({ error: err.message });
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                        // Desconectar sessão
                                                                                                                                                                                                                                                                                        app.post('/disconnect', authMiddleware, async (req, res) => {
                                                                                                                                                                                                                                                                                          if (!client) {
                                                                                                                                                                                                                                                                                              return res.status(400).json({ error: 'Nenhuma sessão ativa.' });
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                  try {
                                                                                                                                                                                                                                                                                                      await client.close();
                                                                                                                                                                                                                                                                                                          client = null;
                                                                                                                                                                                                                                                                                                              sessionStatus = 'DISCONNECTED';
                                                                                                                                                                                                                                                                                                                  qrCodeData = null;
                                                                                                                                                                                                                                                                                                                      res.json({ success: true, message: 'Sessão encerrada.' });
                                                                                                                                                                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                                                                                                                                                            res.status(500).json({ error: err.message });
                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                              // Reconectar sessão
                                                                                                                                                                                                                                                                                                                              app.post('/reconnect', authMiddleware, async (req, res) => {
                                                                                                                                                                                                                                                                                                                                try {
                                                                                                                                                                                                                                                                                                                                    if (client) await client.close().catch(() => {});
                                                                                                                                                                                                                                                                                                                                        client = null;
                                                                                                                                                                                                                                                                                                                                            qrCodeData = null;
                                                                                                                                                                                                                                                                                                                                                await initSession();
                                                                                                                                                                                                                                                                                                                                                    res.json({ success: true, message: 'Reconectando...' });
                                                                                                                                                                                                                                                                                                                                                      } catch (err) {
                                                                                                                                                                                                                                                                                                                                                          res.status(500).json({ error: err.message });
                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                            // Inicia servidor
                                                                                                                                                                                                                                                                                                                                                            app.listen(PORT, () => {
                                                                                                                                                                                                                                                                                                                                                              console.log(`Servidor rodando na porta ${PORT}`);
                                                                                                                                                                                                                                                                                                                                                                initSession().catch(console.error);
                                                                                                                                                                                                                                                                                                                                                                });
