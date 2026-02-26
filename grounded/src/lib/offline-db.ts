import Dexie, { type Table } from 'dexie'
import type { CheckIn, JournalEntry, Reminder } from '@/types'

export interface LocalCheckIn extends CheckIn {
  localId: string
  syncStatus: 'pending' | 'synced'
}

export interface LocalJournalEntry extends JournalEntry {
  localId: string
  syncStatus: 'pending' | 'synced'
}

export interface LocalReminder extends Reminder {
  localId: string
  syncStatus: 'pending' | 'synced'
}

class GroundedDB extends Dexie {
  checkins!: Table<LocalCheckIn>
  journalEntries!: Table<LocalJournalEntry>
  reminders!: Table<LocalReminder>

  constructor() {
    super('grounded')
    this.version(1).stores({
      checkins: 'localId, checkin_date, syncStatus',
      journalEntries: 'localId, entry_date, syncStatus',
      reminders: 'localId, syncStatus',
    })
  }
}

export const db = new GroundedDB()
