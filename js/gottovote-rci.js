---
---
/*
 * GotToVote RCI .js
 * -----------------
 * GotToVote's registration centres information javascript file to fetch information from fusion tables and require no
 * backend server.
 *
 * Requirements
 * ------------
 * Requires the following things to run:
 *  - jQuery 1.11.3
 *
 * AUTHORS
 * -------
 * David Lemayian <david@codeforafrica.org>
 *
 * LICENSE
 * -------
 * GNU General Public License v3.0 (http://choosealicense.com/licenses/gpl-3.0/)
 * The GPL (V2 or V3) is a copyleft license that requires anyone who distributes your code or a derivative work to make
 * the source available under the same terms. V3 is similar to V2, but further restricts use in hardware that forbids
 * software alterations. Linux, Git, and WordPress use GPL.
 *
 * Contribution
 * ------------
 * Would you like to contribute to this file? Just follow Google's JS style guide:
 * https://google.github.io/styleguide/javascriptguide.xml
 *
 */
;

if (typeof gtv !== "object") {
  var gtv = {};
}

gtv.rci = {
  API_KEY: "{{ site.api_key }}",
  TABLE_ID: "{{ site.table_id }}",

  FT_SQL_URL: "https://www.googleapis.com/fusiontables/v2/query",

  config: {
  },

  columns: {
    data: {}
  },
  rows: {
    data: {}
  },

  admin_levels: {
    schema: [
      {% for admin_level in site.ft.admin_levels %}
        {
          id_col: "{{ admin_level.id_col }}",
          name_col: "{{ admin_level.name_col }}",
          title: "{{ admin_level.title }}"
        } {% unless forloop.last %},{% endunless %}
      {% endfor %}
    ],
    data: {},
    selects: []
  }
};

(function ($) {

  gtv.rci.columns.set = function (columns) {
    return this.data = columns;
  };

  gtv.rci.columns.get = function (index) {
    if (typeof this.data.items === 'undefined') {
      return this.fetch();
    } else {
      return this.data.items[index];
    }
  };

  gtv.rci.columns.fetch = function (index) {
    $.ajax({
      url: "https://www.googleapis.com/fusiontables/v2/tables/" + gtv.rci.TABLE_ID + "/columns",
      data: { key: gtv.rci.API_KEY }
    }).done(function (msg) {
      gtv.rci.columns.set(msg);
      if (typeof index === 'number') {
        return gtv.rci.columns.data.items[index];
      } else {
        return gtv.rci.columns.data;
      }
    });
  };

  gtv.rci.admin_levels.display = function (level_index, level_select) {
    level_index = parseInt(level_index);
    if ( !isNaN(parseInt(level_select)) ) {
      level_select = parseInt(level_select);
    };

    if (typeof this.data.levels === 'undefined') {
      this.fetch();
    } else {
      admin_levels_html = [];
      this.selects[level_index] = level_select;

      // iterate through selects

      $.each(this.selects, function (select_index, select_val) {

        level = gtv.rci.admin_levels.data.levels[select_index];

        if (select_index > level_index) {
          gtv.rci.admin_levels.selects[select_index] = 's';
          select_val = 's';
        };

        if (select_index == 0 || gtv.rci.admin_levels.selects[select_index-1] != 's' ) {
          admin_levels_html[select_index] = '' +
            '<div class="col-md-4" id="admin-level-select-' + select_index + '">' +
              '<div>' +
                '<p class="lead">' + gtv.rci.admin_levels.schema[select_index].title + '</p>' +
                '<select class="form-control">' +
                  '<option value="s">Select ' + gtv.rci.admin_levels.schema[select_index].title + '</option>';

                  child_admins = [];

                  if (typeof gtv.rci.admin_levels.selects[select_index-1] === 'number' || select_index == 0) {
                    $.each(gtv.rci.admin_levels.data.levels[select_index].items, function (admin_index, admin_name) {
                      is_child = false;
                      $.each(gtv.rci.admin_levels.data.items, function (levels_check_index, levels_check_value) {
                        if (levels_check_value[select_index*2] == gtv.rci.admin_levels.selects[select_index-1]+1 || select_index == 0) {
                          is_child = true;
                          return false;
                        };
                      });
                      if (is_child) {
                        child_admins.push({
                          id: admin_index,
                          name: admin_name
                        });
                      };
                    });
                  };

                  $.each(child_admins, function (admin_index, admin) {
                      admin_levels_html[select_index] = admin_levels_html[select_index] + '<option value="'+ admin.id +'">' + admin.name.toLowerCase() + '</option>';
                  });

          admin_levels_html[select_index] = admin_levels_html[select_index] +    
                '</select>'+
              '</div>'+
            '</div>';
        } else if (select_val == 's'){
          admin_levels_html[select_index] = 
            '<div class="col-md-4" id="admin-level-select-' + select_index + '">'+
              '<div>'+
                '<p class="lead">' + gtv.rci.admin_levels.schema[select_index].title + '</p>'+
                '<select class="form-control">'+
                  '<option value="s">Please select ' + gtv.rci.admin_levels.schema[select_index-1].title + ' first</option>';
          admin_levels_html[select_index] = admin_levels_html[select_index] +    
                '</select>'+
              '</div>'+
            '</div>';
        };

        return true;
      });

      
      $('#admin-levels-selects').html(admin_levels_html.join(''));
      $.each(gtv.rci.admin_levels.selects, function (select_index, select_value) {
        $('#admin-level-select-' + select_index + ' select').val(select_value.toString());
        $('#admin-level-select-' + select_index + ' select').change( function() {
          gtv.rci.admin_levels.display(select_index, $(this).val());
        });
      });


      return true;

      // Old code

      $.each(gtv.rci.admin_levels.data.levels, function (index, level) {

        if (index < level_index || index == level_index || index == level_index + 1 || index == 0) {
          admin_levels_html[index] = '' +
            '<div class="col-md-4" id="admin-level-select-' + index + '">' +
              '<div>' +
                '<p class="lead">' + gtv.rci.admin_levels.schema[index].title + '</p>' +
                '<select class="form-control">' +
                  '<option value="s">Select ' + gtv.rci.admin_levels.schema[index].title + '</option>';
                  $.each(level.items, function (admin_index, admin_name) {
                    is_child = false;
                    $.each(gtv.rci.admin_levels.data.items, function (levels_check_index, levels_check_value) {
                      if (levels_check_value[level_index*2] == level_select+1 ) {
                        is_child = true;
                        return false;
                      };
                    });
                    if (is_child || index == 0) {
                      admin_levels_html[index] = admin_levels_html[index] + '<option value="'+ admin_index +'">' + admin_name.toLowerCase() + '</option>';
                    };

                  });
          admin_levels_html[index] = admin_levels_html[index] +    
                '</select>'+
              '</div>'+
            '</div>';
          if (index != 0 && index > level_index) {
            gtv.rci.admin_levels.select[index] = 's';
          };
        };

        if (index > level_index && gtv.rci.admin_levels.select[index-1] == 's' || index > level_index + 1) {
          admin_levels_html[index] = 
            '<div class="col-md-4" id="admin-level-select-' + index + '">'+
              '<div>'+
                '<p class="lead">' + gtv.rci.admin_levels.schema[index].title + '</p>'+
                '<select class="form-control">'+
                  '<option value="s">Please select ' + gtv.rci.admin_levels.schema[index-1].title + ' first</option>';
          admin_levels_html[index] = admin_levels_html[index] +    
                '</select>'+
              '</div>'+
            '</div>';
            gtv.rci.admin_levels.selects[index] = 's';
        };
      });
      
    };
  };

  gtv.rci.admin_levels.set = function (data) {
    this.data.items = data;
    this.data.levels = [];
    $.each(gtv.rci.admin_levels.schema, function (schema_index, schema_value){
      $.each(data, function (index, value) {
        if (typeof gtv.rci.admin_levels.data.levels[schema_index] === 'undefined') {
          gtv.rci.admin_levels.data.levels[schema_index] = {
            items: [],
            relations: [],
            html_select: ''
          };
        };
        gtv.rci.admin_levels.data.levels[schema_index].items[value[schema_index*2]-1] = value[(schema_index*2)+1];
      });
      gtv.rci.admin_levels.selects[schema_index] = 's';
    });

    gtv.rci.admin_levels.display(0, 's');
    
    return this.data;
  };

  gtv.rci.admin_levels.fetch = function (index) {
    sql_admin_levels_cols = "";
    $.each(gtv.rci.admin_levels.schema, function(index, value){
      sql_admin_levels_cols += "'" + value.id_col + "'" + "," + "'" + value.name_col + "'" + ",";
    });
    sql_admin_levels_cols = sql_admin_levels_cols.substring(0, sql_admin_levels_cols.length-1);

    sql_admin_levels = "SELECT " + sql_admin_levels_cols + " FROM " + gtv.rci.TABLE_ID +
                      " GROUP BY " + sql_admin_levels_cols +"";

    $.ajax({
      url: gtv.rci.FT_SQL_URL,
      data: {
        sql: sql_admin_levels,
        key: gtv.rci.API_KEY
      }
    }).done( function (response) {
      gtv.rci.admin_levels.set(response.rows);
      console.log(gtv.rci.admin_levels.data);
    });
  };

  gtv.rci.admin_levels.fetch();


  gtv.rci.columns.get(0);

  console.log(gtv.rci);

})(jQuery);


