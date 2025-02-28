package db
import (
	"context"
)

type FrontQuery struct{
	Q *Queries
}


func (fq *FrontQuery) AssignDiaryTag(arg2 AssignDiaryTagParams) (Tag, error) {
	return fq.Q.AssignDiaryTag(context.Background(), arg2)
}

func (fq *FrontQuery) FtsDiarySearch(arg2 string) ([]Diary, error) {
	return fq.Q.FtsDiarySearch(context.Background(), arg2)
}

func (fq *FrontQuery) GetAllDiaries() ([]Diary, error) {
	return fq.Q.GetAllDiaries(context.Background())
}

func (fq *FrontQuery) GetAllDiariesLimit(arg2 GetAllDiariesLimitParams) ([]Diary, error) {
	return fq.Q.GetAllDiariesLimit(context.Background(), arg2)
}

func (fq *FrontQuery) GetDeletedDiaries(arg2 GetDeletedDiariesParams) ([]Trash, error) {
	return fq.Q.GetDeletedDiaries(context.Background(), arg2)
}

func (fq *FrontQuery) GetDiariesCount() (int64, error) {
	return fq.Q.GetDiariesCount(context.Background())
}

func (fq *FrontQuery) GetDiaryByID(arg2 int64) (Diary, error) {
	return fq.Q.GetDiaryByID(context.Background(), arg2)
}

func (fq *FrontQuery) GetDiaryByTag(arg2 GetDiaryByTagParams) ([]Diary, error) {
	return fq.Q.GetDiaryByTag(context.Background(), arg2)
}

func (fq *FrontQuery) GetNoTagDiaries(arg2 GetNoTagDiariesParams) ([]Diary, error) {
	return fq.Q.GetNoTagDiaries(context.Background(), arg2)
}

func (fq *FrontQuery) InitDB(arg2 string, arg3 string) error {
	return fq.Q.InitDB(context.Background(), arg2, arg3)
}

func (fq *FrontQuery) InsertDiaryEntry(arg2 InsertDiaryEntryParams) (Diary, error) {
	return fq.Q.InsertDiaryEntry(context.Background(), arg2)
}

func (fq *FrontQuery) InsertDiaryRecord(arg2 string) (Diary, error) {
	return fq.Q.InsertDiaryRecord(context.Background(), arg2)
}

func (fq *FrontQuery) OpenDB(arg2 string, arg3 string) error {
	return fq.Q.OpenDB(context.Background(), arg2, arg3)
}

func (fq *FrontQuery) UpdateDiaryEntryByID(arg2 UpdateDiaryEntryByIDParams) (Diary, error) {
	return fq.Q.UpdateDiaryEntryByID(context.Background(), arg2)
}
