/*
  # Sistema di Notifiche per Task

  1. Nuove Tabelle
    - `Notifications`
      - `id` (int, primary key, auto increment)
      - `userId` (int, foreign key to Users)
      - `taskId` (int, foreign key to Task)
      - `type` (varchar) - tipo di notifica (task_assigned, task_updated, etc.)
      - `title` (varchar) - titolo della notifica
      - `message` (text) - messaggio della notifica
      - `isRead` (bit) - se la notifica è stata letta
      - `createdAt` (datetime) - data creazione
      - `createdBy` (int, foreign key to Users) - chi ha generato la notifica

  2. Sicurezza
    - Nessuna RLS necessaria per questa tabella (gestita a livello applicativo)

  3. Indici
    - Indice su userId per performance
    - Indice su taskId per performance
    - Indice su isRead per filtrare rapidamente
*/

-- Creazione tabella Notifications
CREATE TABLE IF NOT EXISTS Notifications (
  id int IDENTITY(1,1) PRIMARY KEY,
  userId int NOT NULL,
  taskId int NULL,
  type varchar(50) NOT NULL DEFAULT 'task_assigned',
  title varchar(255) NOT NULL,
  message text NOT NULL,
  isRead bit NOT NULL DEFAULT 0,
  createdAt datetime2 NOT NULL DEFAULT GETDATE(),
  createdBy int NULL,
  
  -- Foreign keys
  CONSTRAINT FK_Notifications_User FOREIGN KEY (userId) REFERENCES Users(id),
  CONSTRAINT FK_Notifications_Task FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE CASCADE,
  CONSTRAINT FK_Notifications_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- Indici per performance
CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
CREATE INDEX IX_Notifications_TaskId ON Notifications(taskId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(createdAt DESC);

-- Indice composto per query comuni
CREATE INDEX IX_Notifications_User_Read ON Notifications(userId, isRead);