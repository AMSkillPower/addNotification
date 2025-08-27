const { sql, getPool } = require('../config/database');

class Task {
  static async getAll() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, codiceTask, descrizione, dataSegnalazione, dataScadenza, stato,
               software, utente, clienti, priorità, commenti, createdBy
        FROM Task
        ORDER BY dataSegnalazione DESC
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero task: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT id, codiceTask, descrizione, dataSegnalazione, dataScadenza, stato,
                 software, utente, clienti, priorità, commenti, createdBy
          FROM Task
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero task: ${error.message}`);
    }
  }

  static async getUserIdByUsername(username) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT id FROM Users WHERE username = @username AND isActive = 1');
    
    return result.recordset[0]?.id || null;
  } catch (error) {
    console.error(`Errore nel recupero ID utente per ${username}:`, error);
    return null;
  }
}

  static async create(taskData) {
  try {
    const pool = await getPool();
    
    // 👈 Ottieni l'ID utente dall'username
    let createdByUserId = null;
    if (taskData.createdByUsername) {
      createdByUserId = await this.getUserIdByUsername(taskData.createdByUsername);
      if (!createdByUserId) {
        throw new Error(`Utente '${taskData.createdByUsername}' non trovato o non attivo`);
      }
    }
    
    const result = await pool.request()
      .input('codiceTask', sql.NVarChar(50), taskData.codiceTask)
      .input('descrizione', sql.NVarChar(255), taskData.descrizione)
      .input('dataSegnalazione', sql.DateTime2, taskData.dataSegnalazione)
      .input('dataScadenza', sql.DateTime2, taskData.dataScadenza)
      .input('stato', sql.NVarChar(30), taskData.stato)
      .input('software', sql.NVarChar(50), taskData.software)
      .input('utente', sql.NVarChar(30), taskData.utente)
      .input('clienti', sql.NVarChar(50), taskData.clienti)
      .input('priorità', sql.NVarChar(30), taskData.priorità)
      .input('commenti', sql.NVarChar(4000), taskData.commenti)
      .input('createdBy', sql.Int, createdByUserId) // 👈 Ora usa l'ID numerico
      .query(`
        INSERT INTO Task (codiceTask, descrizione, dataSegnalazione, dataScadenza, stato,
                          software, utente, clienti, priorità, commenti, createdBy)
        OUTPUT INSERTED.*
        VALUES (@codiceTask, @descrizione, @dataSegnalazione, @dataScadenza, @stato,
                @software, @utente, @clienti, @priorità, @commenti, @createdBy)
      `);
      
    const createdTask = result.recordset[0];
    
    // Crea notifica se il task è assegnato a un utente diverso dal creatore
    if (taskData.utente && createdByUserId) {
      const assignedUserId = await this.getUserIdByUsername(taskData.utente);
      if (assignedUserId && assignedUserId !== createdByUserId) {
        const Notification = require('./Notification');
        await Notification.createTaskAssignmentNotification(
          createdTask, 
          assignedUserId, 
          createdByUserId
        );
      }
    }
    
    await this.createLog({
      utente: taskData.createdByUsername || 'Unknown', // 👈 Fallback se null/undefined
      codiceTask: taskData.codiceTask,
      eventLog: `Task creato: ${taskData.descrizione}`
    });
    
    return createdTask;
  } catch (error) {
    throw new Error(`Errore nella creazione del task: ${error.message}`);
  }
}

  static async update(id, taskData, operatore) {
  try {
    const pool = await getPool();
    const oldResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Task WHERE id = @id');

    const oldTask = oldResult.recordset[0];
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('descrizione', sql.NVarChar(255), taskData.descrizione)
      .input('dataScadenza', sql.DateTime2, taskData.dataScadenza)
      .input('stato', sql.NVarChar(30), taskData.stato)
      .input('utente', sql.NVarChar(30), taskData.utente)
      .input('priorità', sql.NVarChar(30), taskData.priorità)
      .input('commenti', sql.NVarChar(4000), taskData.commenti)
      .query(`
        UPDATE Task
        SET 
            descrizione = @descrizione,
            dataScadenza = @dataScadenza,
            stato = @stato,
            utente = @utente,
            priorità = @priorità,
            commenti = @commenti
        WHERE id = @id
      `);

    const getResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Task WHERE id = @id');
    
    const updatedTask = getResult.recordset[0];
    
    // Crea notifica se l'utente assegnato è cambiato
    if (oldTask.utente !== updatedTask.utente && updatedTask.utente) {
      const updatedByUserId = await this.getUserIdByUsername(operatore);
      const assignedUserId = await this.getUserIdByUsername(updatedTask.utente);
      
      if (assignedUserId && updatedByUserId && assignedUserId !== updatedByUserId) {
        const Notification = require('./Notification');
        await Notification.createTaskAssignmentNotification(
          updatedTask, 
          assignedUserId, 
          updatedByUserId
        );
      }
    }
    
    // Crea notifica di aggiornamento per il creatore del task (se diverso da chi aggiorna)
    if (updatedTask.createdBy) {
      const updatedByUserId = await this.getUserIdByUsername(operatore);
      if (updatedByUserId && updatedTask.createdBy !== updatedByUserId) {
        const Notification = require('./Notification');
        await Notification.createTaskUpdateNotification(updatedTask, updatedByUserId);
      }
    }
    
    var log = `Task aggiornato\n`;
        if (
          oldTask.descrizione !=
          updatedTask.descrizione
        ) {
          log += `Descrizione: ${oldTask.descrizione} -> ${updatedTask.descrizione}\n`;
        }
        if (
          oldTask.dataScadenza.toString() !=
          updatedTask.dataScadenza.toString()
        ) {
          log += `Data scadenza: ${oldTask.dataScadenza} -> ${updatedTask.dataScadenza}\n`;
        }
        if (oldTask.stato != updatedTask.stato) {
          log += `Stato: ${oldTask.stato} -> ${updatedTask.stato}\n`;
        }
        if (oldTask.utente != updatedTask.utente) {
          log += `Utente: ${oldTask.utente} -> ${updatedTask.utente}\n`;
        }
        if (
          oldTask.priorita != updatedTask.priorita
        ) {
          log += `Priorita: ${oldTask.priorita} -> ${updatedTask.priorita}\n`;
        }
        if (
          oldTask.commenti != updatedTask.commenti
        ) {
          log += `Commenti: ${oldTask.commenti} -> ${updatedTask.commenti}\n`;
        }

    await this.createLog({
      utente: operatore, // <-- qui usi chi sta modificando
      codiceTask: taskData.codiceTask,
      eventLog: log
    });

    return updatedTask;
  } catch (error) {
    throw new Error(`Errore nell'aggiornamento del task: ${error.message}`);
  }
}

static async delete(id, operatore) {
  try {
    const pool = await getPool();

    const taskResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT codiceTask, descrizione FROM Task WHERE id = @id');

    const task = taskResult.recordset[0];

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Task WHERE id = @id');

    if (task) {
      await this.createLog({
        utente: operatore, // <-- qui usi chi elimina
        codiceTask: task.codiceTask,
        eventLog: `Task eliminato: ${task.descrizione}`
      });
    }

    return true;
  } catch (error) {
    throw new Error(`Errore nell'eliminazione del task: ${error.message}`);
  }
}

  static async createLog(logData) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('utente', sql.NVarChar(50), logData.utente)
        .input('codiceTask', sql.NVarChar(50), logData.codiceTask)
        .input('eventLog', sql.NVarChar(sql.MAX), logData.eventLog)
        .input('data', sql.DateTime2, new Date())
        .query(`
          INSERT INTO taskLog (utente, codiceTask, eventLog, data)
          OUTPUT INSERTED.*
          VALUES (@utente, @codiceTask, @eventLog, @data)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione del log: ${error.message}`);
    }
  }

  static async getLogs(codiceTask = null) {
    try {
      const pool = await getPool();
      let query = `
        SELECT id, utente, codiceTask, eventLog, data
        FROM taskLog
        ORDER BY data DESC
      `;
      
      if (codiceTask) {
        query = `
          SELECT id, utente, codiceTask, eventLog, data
          FROM taskLog
          WHERE codiceTask = @codiceTask
          ORDER BY data DESC
        `;
      }

      const request = pool.request();
      if (codiceTask) {
        request.input('codiceTask', sql.NVarChar(50), codiceTask);
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero logs: ${error.message}`);
    }
  }

  static async getLogsByUser(utente) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('utente', sql.NVarChar(50), utente)
        .query(`
          SELECT id, utente, codiceTask, eventLog, data
          FROM taskLog
          WHERE utente = @utente
          ORDER BY data DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero logs utente: ${error.message}`);
    }
  }
}

module.exports = Task;
