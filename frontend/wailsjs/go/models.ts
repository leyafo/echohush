export namespace db {
	
	export class AssignDiaryTagParams {
	    DiaryID: number;
	    Tag: string;
	
	    static createFrom(source: any = {}) {
	        return new AssignDiaryTagParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DiaryID = source["DiaryID"];
	        this.Tag = source["Tag"];
	    }
	}
	export class Diary {
	    ID: number;
	    Entry: string;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Diary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Entry = source["Entry"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetAllDiariesLimitParams {
	    Limit: number;
	    Offset: number;
	
	    static createFrom(source: any = {}) {
	        return new GetAllDiariesLimitParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Limit = source["Limit"];
	        this.Offset = source["Offset"];
	    }
	}
	export class GetDeletedDiariesParams {
	    Limit: number;
	    Offset: number;
	
	    static createFrom(source: any = {}) {
	        return new GetDeletedDiariesParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Limit = source["Limit"];
	        this.Offset = source["Offset"];
	    }
	}
	export class GetDiaryByTagParams {
	    Tag: string;
	    Limit: number;
	    Offset: number;
	
	    static createFrom(source: any = {}) {
	        return new GetDiaryByTagParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Tag = source["Tag"];
	        this.Limit = source["Limit"];
	        this.Offset = source["Offset"];
	    }
	}
	export class GetNoTagDiariesParams {
	    Limit: number;
	    Offset: number;
	
	    static createFrom(source: any = {}) {
	        return new GetNoTagDiariesParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Limit = source["Limit"];
	        this.Offset = source["Offset"];
	    }
	}
	export class InsertDiaryEntryParams {
	    Entry: string;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new InsertDiaryEntryParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Entry = source["Entry"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Tag {
	    ID: number;
	    DiaryID: number;
	    Tag: string;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.DiaryID = source["DiaryID"];
	        this.Tag = source["Tag"];
	    }
	}
	export class Trash {
	    ID: number;
	    DiaryID: number;
	    DiaryEntry: string;
	    // Go type: time
	    DiaryCreatedAt: any;
	    // Go type: time
	    DiaryUpdatedAt: any;
	    // Go type: time
	    CreatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Trash(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.DiaryID = source["DiaryID"];
	        this.DiaryEntry = source["DiaryEntry"];
	        this.DiaryCreatedAt = this.convertValues(source["DiaryCreatedAt"], null);
	        this.DiaryUpdatedAt = this.convertValues(source["DiaryUpdatedAt"], null);
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateDiaryEntryByIDParams {
	    Entry: string;
	    ID: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdateDiaryEntryByIDParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Entry = source["Entry"];
	        this.ID = source["ID"];
	    }
	}

}

