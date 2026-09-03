const fs = require('fs');

let api = fs.readFileSync('assets/switch.api.js', 'utf8');

const target = `      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur de connexion au serveur." };
        }
        console.warn("[SwitchAPI] RPC Fallback LocalStorage :", e.message);
      }`;

const replacement = `      } catch (e) {
        console.warn("[SwitchAPI] RPC Fallback LocalStorage :", e.message);
      }`;

api = api.replace(target, replacement);

fs.writeFileSync('assets/switch.api.js', api);
fs.writeFileSync('www/assets/switch.api.js', api);
console.log('✔ Fixed transfer offline fallback in switch.api.js');
