var Search = require('../../app/scripts/src/content/search');
var Settings = require('../../app/scripts/src/settings.js');
var success = sinon.spy();
var error = sinon.spy();
var rocky = { title: 'Rocky', type: 'movie' };
var movieSearch = new Search({ item: rocky });
var madMen = { type: 'show', season: 1, episode: 1, title: 'Mad Men' };
var episodeSearch = new Search({ item: madMen });

describe('Search', function() {
  beforeEach(function() {
    this.xhr = sinon.useFakeXMLHttpRequest();
    var requests = this.requests = [];
    this.xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function() {
    this.xhr.restore();
    success.reset();
    error.reset();
  });

  it('sets properties in constructor', function() {
    expect(movieSearch.item).toBe(rocky);
    expect(movieSearch.url).toBe(Settings.apiUri + '/search');
    expect(movieSearch.showsUrl).toBe(Settings.apiUri + '/shows');
  });

  it('getUrl function', function() {
    expect(movieSearch.getUrl()).toBe(Settings.apiUri + '/search?type=' + rocky.type +
      '&query=' + rocky.title);
  });

  it('getEpisodeUrl function', function() {
    expect(episodeSearch.getEpisodeUrl('mad-men')).toBe(Settings.apiUri +
      '/shows/mad-men/seasons/' + madMen.season + '/episodes/' +
      madMen.episode + '?extended=images');
  });

  it('findMovie returns first search result', function() {
    movieSearch.findMovie({ success: success, error: error });
    expect(this.requests.length).toBe(1);
    this.requests[0].respond(200, { 'Content-Type': 'application/json' },
      '[{ "movie": { "title": "Rocky" } }, { "movie": { "title": "Rocky II" } }]');
    expect(success.callCount).toBe(1);
    expect(success.getCall(0).args).toEqual([{ movie: { title: 'Rocky' } }]);
  });

  it('findMovie returns error callback', function() {
    movieSearch.findMovie({ success: success, error: error });
    expect(this.requests.length).toBe(1);
    this.requests[0].respond(400, { 'Content-Type': 'application/json' },
      '{ "errors": "Bad Request" }');
    expect(error.callCount).toBe(1);
    expect(error.getCall(0).args).toEqual([400, '{ "errors": "Bad Request" }']);
  });

  it('findEpisode returns first search result', function() {
    episodeSearch.findEpisode({ success: success, error: error });
    expect(this.requests.length).toBe(1);
    this.requests[0].respond(200, { 'Content-Type': 'application/json' },
      '[{ "show": { "title": "Mad Men", "ids": { "slug": "mad-men" } } }]');
    expect(this.requests.length).toBe(2);
    this.requests[1].respond(200, { 'Content-Type': 'application/json' },
      '{ "title": "Ladies Room", "season": 1, "number": 2 }');
    expect(success.callCount).toBe(1);
    expect(success.getCall(0).args).toEqual([{
      title: 'Ladies Room', season: 1, number: 2
    }]);
  });

  it('findEpisode returns error callback', function() {
    episodeSearch.findEpisode({ success: success, error: error });
    expect(this.requests.length).toBe(1);
    this.requests[0].respond(200, { 'Content-Type': 'application/json' },
      '[{ "show": { "title": "Mad Men", "ids": { "slug": "mad-men" } } }]');
    expect(this.requests.length).toBe(2);
    this.requests[1].respond(400, { 'Content-Type': 'application/json' },
      '{ "errors": "Bad Request" }');
    expect(error.callCount).toBe(1);
    expect(error.getCall(0).args).toEqual([400, '{ "errors": "Bad Request" }']);
  });

  it('findEpisode returns error callback on second request', function() {
    episodeSearch.findEpisode({ success: success, error: error });
    expect(this.requests.length).toBe(1);
    this.requests[0].respond(400, { 'Content-Type': 'application/json' },
      '{ "errors": "Bad Request" }');
    expect(error.callCount).toBe(1);
    expect(error.getCall(0).args).toEqual([400, '{ "errors": "Bad Request" }']);
  });

  it('when item type is show, find calls findEpisode', function() {
    episodeSearch.findEpisode = sinon.spy();
    episodeSearch.find({ success: success, error: error });
    expect(episodeSearch.findEpisode.callCount).toBe(1);
    expect(episodeSearch.findEpisode.getCall(0).args).toEqual([{ success: success, error: error }]);
  });

  it('when item type is movie, ind calls findMovie', function() {
    movieSearch.findMovie = sinon.spy();
    movieSearch.find({ success: success, error: error });
    expect(movieSearch.findMovie.callCount).toBe(1);
    expect(movieSearch.findMovie.getCall(0).args).toEqual([{ success: success, error: error }]);
  });
});