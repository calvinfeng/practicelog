package cmd

import (
	"fmt"
	"github.com/calvinfeng/practicelog/practicelog/logstore"
	"github.com/jmoiron/sqlx"
	"os"
	"time"

	"github.com/calvinfeng/practicelog/practicelog"
	"github.com/calvinfeng/practicelog/trelloapi"
	"github.com/sirupsen/logrus"
)

const board2021ID = "j3PmqolX"
const board2020ID = "woq8deqm"
const board2019ID = "B2VXMAm0"

// TODO: Need to find a way to support data reloading/reseeding.
// For example, if label already exists, don't fail early. Same applies for log entries.
func seedDB(addr string) error {
	api := trelloapi.New(trelloapi.Config{
		TrelloAPIKey:   os.Getenv("TRELLO_API_KEY"),
		TrelloAPIToken: os.Getenv("TRELLO_API_TOKEN"),
	})

	pg, err := sqlx.Open("postgres", addr)
	if err != nil {
		return err
	}

	store := logstore.New(pg)
	if err := seedLogLabels(store); err != nil {
		return fmt.Errorf("failed to insert practicelog labels %w", err)
	}

	logrus.Info("inserting entries from 2019")
	if err := seedLogEntriesByBoardID(board2019ID, api, store); err != nil {
		return fmt.Errorf("failed to insert log entries %w", err)
	}

	logrus.Infof("inserting entries from 2020")
	if err := seedLogEntriesByBoardID(board2020ID, api, store); err != nil {
		return fmt.Errorf("failed to insert log entries %w", err)
	}

	logrus.Infof("inserting entries from 2021")
	if err := seedLogEntriesByBoardID(board2021ID, api, store); err != nil {
		return fmt.Errorf("failed to insert log entries %w", err)
	}

	count, err := store.CountLogEntries()
	if err != nil {
		return err
	}

	entries, err := store.SelectLogEntries(uint64(count), 0)
	if err != nil {
		return err
	}

	logrus.Infof("successfully inserted %d entries to database after loading data", len(entries))

	return nil
}

func seedLogLabels(store practicelog.Store) error {
	defaultParentLogLabels := []*practicelog.Label{
		{Name: "Acoustic"},
		{Name: "Blues"},
		{Name: "Finger Mechanics"},
		{Name: "Jam Sessions"},
		{Name: "Music Lessons"},
		{Name: "Songs"},
		{Name: "Scales"},
	}
	for _, label := range defaultParentLogLabels {
		label.Username = "calvin.j.feng@gmail.com"
	}

	inserted, err := store.BatchInsertLogLabels(defaultParentLogLabels...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d parent log labels", inserted)

	defaultChildLogLabels := []*practicelog.Label{
		{Name: "Acoustic Rhythm", ParentID: defaultParentLogLabels[0].ID},
		{Name: "Spider Walk", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Trills", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Linear Exercises", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Angular Exercises", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Barre Chords", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Chord Change", ParentID: defaultParentLogLabels[2].ID},
		{Name: "Now & Forever", ParentID: defaultParentLogLabels[5].ID},
		{Name: "The Final Countdown", ParentID: defaultParentLogLabels[5].ID},
		{Name: "海阔天空", ParentID: defaultParentLogLabels[5].ID},
		{Name: "灰色轨迹", ParentID: defaultParentLogLabels[5].ID},
		{Name: "光辉岁月", ParentID: defaultParentLogLabels[5].ID},
		{Name: "直到世界的尽头", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Back In Black", ParentID: defaultParentLogLabels[5].ID},
		{Name: "November Rain", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Seven Nation Army", ParentID: defaultParentLogLabels[5].ID},
		{Name: "21 Guns", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Perfect", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Comfortably Numb", ParentID: defaultParentLogLabels[5].ID},
		{Name: "刻在我心底的名字", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Afterglow", ParentID: defaultParentLogLabels[5].ID},
		{Name: "Note Memorization", ParentID: defaultParentLogLabels[6].ID},
	}

	for _, label := range defaultChildLogLabels {
		label.Username = "calvin.j.feng@gmail.com"
	}

	inserted, err = store.BatchInsertLogLabels(defaultChildLogLabels...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d child log labels", inserted)

	return nil
}

func seedLogEntriesByBoardID(boardID string, api trelloapi.Service, store practicelog.Store) error {
	logLabelsByName := make(map[string]*practicelog.Label)

	logLabels, err := store.SelectLogLabels()
	if err != nil {
		return err
	}

	for _, logLabel := range logLabels {
		logLabelsByName[logLabel.Name] = logLabel
	}

	trelloLabels, err := api.TrelloLabelsByBoard(boardID)
	if err != nil {
		return err
	}

	trelloLabelsByID := make(map[string]trelloapi.TrelloLabel)
	for _, label := range trelloLabels {
		trelloLabelsByID[label.ID] = label
	}

	trelloChecklists, err := api.TrelloChecklistsByBoard(boardID)
	if err != nil {
		return err
	}

	trelloChecklistsByID := make(map[string]trelloapi.TrelloChecklist)
	for _, checklist := range trelloChecklists {
		trelloChecklistsByID[checklist.ID] = checklist
	}

	trelloCards, err := api.TrelloCardsByBoard(boardID)
	if err != nil {
		return err
	}

	entries := make([]*practicelog.Entry, 0, len(trelloCards))
	for _, card := range trelloCards {
		if card.IsTemplate {
			continue
		}

		logrus.Infof("loaded card %s", card.ID)
		trelloID := card.ID

		entry := new(practicelog.Entry)
		entry.TrelloID = &trelloID
		entry.Message = card.Name
		entry.Details = card.Description
		entry.Labels = make([]*practicelog.Label, 0)
		entry.Username = "calvin.j.feng@gmail.com"
		for _, labelID := range card.LabelIDs {
			label, ok := trelloLabelsByID[labelID]
			if !ok {
				return fmt.Errorf("label %s not found", labelID)
			}

			if duration, err := time.ParseDuration(label.Name); err == nil {
				entry.Duration += int32(duration.Minutes())
			} else {
				switch label.Name {
				case "Barre Chords":
					entry.Labels = append(entry.Labels, logLabelsByName["Finger Mechanics"], logLabelsByName["Barre Chords"])
				case "Chord Change":
					entry.Labels = append(entry.Labels, logLabelsByName["Finger Mechanics"], logLabelsByName["Chord Change"])
				case "Rhythm":
					entry.Labels = append(entry.Labels, logLabelsByName["Acoustic"], logLabelsByName["Acoustic Rhythm"])
				default:
					if logLabel, ok := logLabelsByName[label.Name]; ok {
						entry.Labels = append(entry.Labels, logLabel)
					} else {
						logrus.Errorf("found unrecognized label name %s from Trello", label.Name)
					}
				}
			}
		}

		var position int
		entry.Assignments = make([]*practicelog.Assignment, 0)
		for _, listID := range card.ChecklistIDs {
			checklist, ok := trelloChecklistsByID[listID]
			if !ok {
				logrus.Fatalf("check list %s not found", listID)
			}

			for _, item := range checklist.Items {
				entry.Assignments = append(entry.Assignments, &practicelog.Assignment{
					Position:  position,
					Name:      item.Name,
					Completed: item.State == "complete",
				})
				position++
			}
		}

		if card.Due == "" {
			continue
		}

		date, err := time.Parse(time.RFC3339, card.Due)
		if err != nil {
			logrus.WithError(err).Warnf("failed to parse due date of card %s %s", card.ID, card.Name)
			continue
		}
		entry.Date = date

		entries = append(entries, entry)
	}

	inserted, err := store.BatchInsertLogEntries(entries...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d entries", inserted)
	return nil
}
