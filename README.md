# WPPConnect + Contabo VPS

Servidor WhatsApp usando WPPConnect rodando em VPS Contabo.

## Estrutura do Projeto

```
wppconnect-contabo/
├── src/
│   └── index.js        # Servidor Express + WPPConnect
├── tokens/             # Criado automaticamente (sessoes salvas)
├── .env                # Variaveis de ambiente (nao commitar!)
├── .env.example        # Exemplo de variaveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## Endpoints da API

Todos os endpoints requerem o header `x-api-key` ou query param `?key=SUA_CHAVE`.

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/status` | Status da sessao |
| GET | `/qrcode` | Exibe QR Code para autenticar |
| POST | `/send-message` | Envia mensagem de texto |
| POST | `/send-image` | Envia imagem por URL |
| POST | `/disconnect` | Encerra a sessao |
| POST | `/reconnect` | Reconecta a sessao |

### Exemplos de uso

**Enviar mensagem:**
```bash
curl -X POST http://SEU_IP:3000/send-message \
  -H "x-api-key: sua-chave-aqui" \
    -H "Content-Type: application/json" \
      -d '{"phone": "5511999999999", "message": "Ola!"}'
      ```

      **Ver QR Code:**
      ```
      http://SEU_IP:3000/qrcode?key=sua-chave-aqui
      ```

      ## Deploy no VPS Contabo

      ### 1. Conectar via SSH

      ```bash
      ssh root@SEU_IP_CONTABO
      ```

      ### 2. Clonar o repositorio

      ```bash
      cd /opt
      git clone https://github.com/QueirozSan/wppconnect-contabo.git
      cd wppconnect-contabo
      ```

      ### 3. Instalar dependencias

      ```bash
      npm install
      ```

      ### 4. Configurar variaveis de ambiente

      ```bash
      cp .env.example .env
      nano .env
      # Edite PORT, SECRET_KEY e SESSION_NAME
      ```

      ### 5. Instalar PM2 (processo em background)

      ```bash
      npm install -g pm2
      ```

      ### 6. Iniciar com PM2

      ```bash
      npm run pm2:start
      pm2 save
      pm2 startup
      ```

      ### 7. Ver logs

      ```bash
      npm run pm2:logs
      ```

      ### 8. Acessar QR Code

      Abra no navegador:
      ```
      http://SEU_IP:3000/qrcode?key=sua-chave-aqui
      ```
      Escaneie o QR Code com o WhatsApp do celular.

      ## Comandos uteis

      ```bash
      # Reiniciar
      npm run pm2:restart

      # Parar
      npm run pm2:stop

      # Ver logs em tempo real
      npm run pm2:logs

      # Status dos processos PM2
      pm2 status
      ```

      ## Requisitos

      - Node.js >= 18
      - Google Chrome ou Chromium instalado
      - PM2 (recomendado para producao)

      ## Seguranca

      - Nunca commite o arquivo `.env`
      - Use uma `SECRET_KEY` forte e unica
      - Configure o firewall da Contabo para liberar apenas a porta necessaria
