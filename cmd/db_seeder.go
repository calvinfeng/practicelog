package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/calvinfeng/practicelog/log"
	"github.com/calvinfeng/practicelog/log/logstore"
	"github.com/calvinfeng/practicelog/trelloapi"
	"github.com/jmoiron/sqlx"
	"github.com/sirupsen/logrus"
)

const board2020ID = "woq8deqm"
const board2019ID = "B2VXMAm0"

func seedLogLabels(store log.Store) error {
	defaultParentLogLabels := []*log.Label{
		{Name: "Acoustic"},
		{Name: "Blues"},
		{Name: "Finger Mechanics"},
		{Name: "Jam Sessions"},
		{Name: "Music Lessons"},
		{Name: "Songs"},
		{Name: "Scales"},
	}

	inserted, err := store.BatchInsertLogLabels(defaultParentLogLabels...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d parent log labels", inserted)

	defaultChildLogLabels := []*log.Label{
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
		{Name: "Note Memorization", ParentID: defaultParentLogLabels[6].ID},
	}

	inserted, err = store.BatchInsertLogLabels(defaultChildLogLabels...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d child log labels", inserted)

	return nil
}

func seedLogEntriesByBoardID(boardID string, api trelloapi.Service, store log.Store) error {
	logLabelsByName := make(map[string]*log.Label)

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

	entries := make([]*log.Entry, 0, len(trelloCards))
	for _, card := range trelloCards {
		if card.IsTemplate {
			continue
		}

		entry := new(log.Entry)
		entry.Message = card.Name
		entry.Details = card.Description
		entry.Labels = make([]*log.Label, 0)
		entry.UserID = "calvin.j.feng@gmail.com"
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
		entry.Assignments = make([]*log.Assignment, 0)
		for _, listID := range card.ChecklistIDs {
			checklist, ok := trelloChecklistsByID[listID]
			if !ok {
				logrus.Fatalf("check list %s not found", listID)
			}

			for _, item := range checklist.Items {
				entry.Assignments = append(entry.Assignments, &log.Assignment{
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
		if len(entry.Labels) == 0 {
			logrus.Warnf("log entry %s %s has no labels", entry.Message, entry.Date)
		}

		entries = append(entries, entry)
	}

	inserted, err := store.BatchInsertLogEntries(entries...)
	if err != nil {
		return err
	}

	logrus.Infof("inserted %d entries", inserted)
	return nil
}

func seedDB() error {
	api := trelloapi.New(trelloapi.Config{
		TrelloAPIKey:   os.Getenv("TRELLO_API_KEY"),
		TrelloAPIToken: os.Getenv("TRELLO_API_TOKEN"),
	})

	pg, err := sqlx.Open("postgres", databaseAddress())
	if err != nil {
		return err
	}

	store := logstore.New(pg)
	if err := seedLogLabels(store); err != nil {
		return fmt.Errorf("failed to seed log labels %w", err)
	}

	if err := seedLogEntriesByBoardID(board2019ID, api, store); err != nil {
		return fmt.Errorf("failed to seed log entries %w", err)
	}

	if err := seedLogEntriesByBoardID(board2020ID, api, store); err != nil {
		return fmt.Errorf("failed to seed log entries %w", err)
	}

	count, err := store.CountLogEntries()
	if err != nil {
		return err
	}

	entries, err := store.SelectLogEntries(uint64(count), 0)
	if err != nil {
		return err
	}

	logrus.Infof("found %d entries from database after seeding", len(entries))

	return nil
}
