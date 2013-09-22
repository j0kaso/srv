(function ($) {
  /***
   * A sample AJAX data store implementation.
   */
  function MppdRemoteModel() {
    // private
    var PAGESIZE = 50;
    var data = {length: 0};
    var searchstr = "";
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();


    function init() {
    }

    /*"pdb_id", "pdb_title", "pdb_keywords", "pdb_experiment", "pdb_resolution",
    "opm_superfamily", "opm_family", "opm_representative",
    "mpstruc_group", "mpstruc_subgroup", "mpstruc_name"*/

    function DataItem( row ) {
      this.pdb_id = row[0];
      this.pdb_title = row[1];
      this.pdb_keywords = row[2];
      this.pdb_experiment = row[3];
      this.pdb_resolution = row[4];

      this.opm_superfamily = row[5];
      this.opm_family = row[6];
      this.opm_representative = row[7];
      this.opm_species = row[8];
      this.opm_related = row[9];

      this.mpstruc_group = row[10];
      this.mpstruc_subgroup = row[11];
      this.mpstruc_name = row[12];
      this.mpstruc_species = row[13];
      this.mpstruc_master = row[14];
      this.mpstruc_related = row[15];

      this.curated_representative = row[16];
      this.curated_related = row[17];

      this.status = row[18];
    }

    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] == undefined || data[i] == null) {
          return false;
        }
      }

      return true;
    }


    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }


    function ensureData(from, to) {
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      if (data.length > 0) {
        to = Math.min(to, data.length - 1);
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
        // TODO:  look-ahead
        onDataLoaded.notify({from: from, to: to});
        return;
      }

      // var url = "http://api.thriftdb.com/api.hnsearch.com/items/_search?filter[fields][type][]=submission&q=" + searchstr + "&start=" + (fromPage * PAGESIZE) + "&limit=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

      var url = "../query?keywds=" + searchstr + "&start=" + (fromPage * PAGESIZE) + "&limit=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

      if (sortcol != null) {
          url += ("&sortby=" + sortcol + "&dir=" + ((sortdir > 0) ? "asc" : "desc"));
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {
        for (var i = fromPage; i <= toPage; i++)
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({from: from, to: to});

        req = $.ajax({
          url: url,
          dataType: "json",
          callbackParameter: "callback",
          cache: true,
          success: onSuccess,
          error: function () {
            onError(fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }


    function onError(fromPage, toPage) {
      console.error(
        "error loading pages " + fromPage + " to " + toPage
      );
    }

    function onSuccess(resp) {
      console.log( resp )
      var from = resp.start;
      var to = from + resp.results.length;
      data.length = resp.hits

      for (var i = 0; i < resp.results.length; i++) {
        data[from + i] = new DataItem( resp.results[i] );
        data[from + i].index = from + i;
      }

      req = null;

      onDataLoaded.notify({from: from, to: to});
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to);
    }


    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }


    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, {
    Slick: { Data: { MppdRemoteModel: MppdRemoteModel } }
  });
})(jQuery);