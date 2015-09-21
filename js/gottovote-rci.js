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
  },

  reg_centres: {
    schema:
      {
        id_col: "{{ site.ft.reg_centres.id_col }}",
        name_col: "{{ site.ft.reg_centres.name_col }}",
        phase_col: "{{ site.ft.reg_centres.phase_col }}",
        phase_start_col: "{{ site.ft.reg_centres.phase_start_col }}",
        phase_end_col: "{{ site.ft.reg_centres.phase_end_col }}",
        title: "{{ site.ft.reg_centres.title }}",

        ward_name_col: "{{ site.ft.reg_centres.ward_name_col }}",
        polling_district_no: "{{ site.ft.reg_centres.polling_district_no }}",
        polling_district_name: "{{ site.ft.reg_centres.polling_district_name }}",

        data: {
          columns: {}
        }
      },
    data: {}
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
    }).done(function (response) {
      gtv.rci.columns.set(response);
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

      $.each(this.selects, function (select_index, select_value) {

        level = gtv.rci.admin_levels.data.levels[select_index];

        if (select_index > level_index) {
          gtv.rci.admin_levels.selects[select_index] = 's';
          select_value = 's';
        };

        if (select_index == 0 || gtv.rci.admin_levels.selects[select_index-1] != 's' ) {
          admin_levels_html[select_index] = '' +
            '<div class="col-md-4" id="admin-level-select-' + select_index + '">' +
              '<div>' +
                '<p class="lead">' + gtv.rci.admin_levels.schema[select_index].title + '</p>' +
                '<select class="form-control">' +
                  '<option value="s">Select ' + gtv.rci.admin_levels.schema[select_index].title + '</option>';

                  child_admins = [];

                  $.each(gtv.rci.admin_levels.data.levels[select_index].items, function (admin_index, admin_name) {
                    is_child = false;
                    $.each(gtv.rci.admin_levels.data.items, function (levels_check_index, levels_check_value) {
                      if (select_index == 0) {
                        is_child = true;
                        return false;
                      } else if (levels_check_value[(select_index-1)*2] == gtv.rci.admin_levels.selects[select_index-1]+1 && levels_check_value[select_index*2] == admin_index + 1) {
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

                  $.each(child_admins, function (admin_index, admin) {
                      admin_levels_html[select_index] = admin_levels_html[select_index] + '<option value="'+ admin.id +'">' + admin.name.toLowerCase() + '</option>';
                  });

          admin_levels_html[select_index] = admin_levels_html[select_index] +    
                '</select>'+
              '</div>'+
            '</div>';
        } else if (select_value == 's'){
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

        if (level_select != 's' && select_index > level_index) {
          gtv.rci.admin_levels.display(select_index, $('#admin-level-select-' + select_index + ' select').children().eq(1).val());
        };

      });

      // TODO: Display the rest of the details if the last select is not 's'; else clear the section
      gtv.rci.reg_centres.display();

      return true;
    };
  };

  gtv.rci.admin_levels.set = function (data) {
    this.data.items = data;
    this.data.levels = [];
    $.each(this.schema, function (schema_index, schema_value){
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

    this.display(0, 's');
    
    return this.data;
  };

  gtv.rci.admin_levels.fetch = function (index) {
    sql_admin_levels_cols = "";
    $.each(this.schema, function(index, value){
      sql_admin_levels_cols += "'" + value.id_col + "'" + "," + "'" + value.name_col + "'" + ",";
    });
    sql_admin_levels_cols = sql_admin_levels_cols.substring(0, sql_admin_levels_cols.length-1);

    sql_admin_levels = "SELECT " + sql_admin_levels_cols + " FROM " + gtv.rci.TABLE_ID +
                      " GROUP BY " + sql_admin_levels_cols;

    $.ajax({
      url: gtv.rci.FT_SQL_URL,
      data: {
        sql: sql_admin_levels,
        key: gtv.rci.API_KEY
      }
    }).done( function (response) {
      gtv.rci.admin_levels.set(response.rows);
    });
  };



  gtv.rci.reg_centres.display = function (is_fetched) {
    if (gtv.rci.admin_levels.selects[gtv.rci.admin_levels.selects.length-1] == 's') {
      $('#gtv-reg-centres').html('');
      return false;
    };

    $('#gtv-reg-centres').html('<p class="text-centre"><i class="fa fa-spinner fa-pulse fa-3x"></i></p>');

    if (!is_fetched) {
      this.fetch();
      return false;
    } else {
      reg_centres_phases_html = [];
      $.each(this.data.phases, function (phase_index, phase) {
        reg_centres_phases_html[phase_index] = '' +
          '<div class="col-md-8 col-md-offset-2 text-centre">' +
            '<h3>Phase ' + (phase_index+1) + '</h3>' +
            '<p class="text-muted">From: ' + phase.start + ' | To: ' + phase.end + '</p>'+
          '</div>';

        reg_centres_phases_html[phase_index] += '' +
          '<div class="col-md-6 col-md-offset-3 text-centre"><hr/>';
        
          $.each(gtv.rci.reg_centres.data.centres, function (centre_index, centre) {
            if (centre.phase == phase_index+1) {
              reg_centres_phases_html[phase_index] += '<p>' + centre.name + '</p><hr/>';
            };
          });

        reg_centres_phases_html[phase_index] += '</div>';
      });

      $('#gtv-reg-centres').html(reg_centres_phases_html.join(''));
    };
    
  };

  gtv.rci.reg_centres.set = function (rows) {
    this.data.items = rows;
    this.data.centres = [];
    this.data.phases = [];

    $.each(gtv.rci.columns.data.items, function(column_index, column_data){
      if (column_data.name == gtv.rci.reg_centres.schema.id_col) {
        gtv.rci.reg_centres.schema.data.columns.id = column_index;
      };
      if (column_data.name == gtv.rci.reg_centres.schema.name_col) {
        gtv.rci.reg_centres.schema.data.columns.name = column_index;
      };

      if (column_data.name == gtv.rci.reg_centres.schema.phase_col) {
        gtv.rci.reg_centres.schema.data.columns.phase = column_index;
      };
      if (column_data.name == gtv.rci.reg_centres.schema.phase_start_col) {
        gtv.rci.reg_centres.schema.data.columns.phase_start = column_index;
      };
      if (column_data.name == gtv.rci.reg_centres.schema.phase_end_col) {
        gtv.rci.reg_centres.schema.data.columns.phase_end = column_index;
      };

      if (column_data.name == gtv.rci.reg_centres.schema.ward_name_col) {
        gtv.rci.reg_centres.schema.data.columns.ward_name = column_index;
      };
      if (column_data.name == gtv.rci.reg_centres.schema.polling_district_no) {
        gtv.rci.reg_centres.schema.data.columns.pd_no = column_index;
      };
      if (column_data.name == gtv.rci.reg_centres.schema.polling_district_name) {
        gtv.rci.reg_centres.schema.data.columns.pd_name = column_index;
      };
    });

    $.each(rows, function (row_index, row_data) {
      gtv.rci.reg_centres.data.centres.push(
        {
          id: row_data[gtv.rci.reg_centres.schema.data.columns.id],
          name: row_data[gtv.rci.reg_centres.schema.data.columns.name],

          ward_name: row_data[gtv.rci.reg_centres.schema.data.columns.ward_name],
          pd_no: row_data[gtv.rci.reg_centres.schema.data.columns.pd_no],
          pd_name: row_data[gtv.rci.reg_centres.schema.data.columns.pd_name],

          phase: row_data[gtv.rci.reg_centres.schema.data.columns.phase]
        }
      );

      gtv.rci.reg_centres.data.phases[row_data[gtv.rci.reg_centres.schema.data.columns.phase]-1] = {
        start: row_data[gtv.rci.reg_centres.schema.data.columns.phase_start],
        end: row_data[gtv.rci.reg_centres.schema.data.columns.phase_end]
      };

    });

    this.display(true);
    
    return this.data;
  };

  gtv.rci.reg_centres.fetch = function () {

    if (gtv.rci.admin_levels.selects[gtv.rci.admin_levels.selects.length - 1] == 's') {
      return false;
    };

    sql_reg_centres = "";
    $.each(gtv.rci.columns.data.items, function (column_index, column_data) {
      sql_reg_centres += "'" + column_data.name + "',";
    });
    sql_reg_centres = sql_reg_centres.substring(0, sql_reg_centres.length-1);

    sql_reg_centres = "SELECT " + sql_reg_centres + " FROM " + gtv.rci.TABLE_ID + " WHERE '" +
                      gtv.rci.admin_levels.schema[gtv.rci.admin_levels.schema.length-1].id_col + "'" +
                      "=" + (gtv.rci.admin_levels.selects[gtv.rci.admin_levels.selects.length-1]+1);

    $.ajax({
      url: gtv.rci.FT_SQL_URL,
      data: {
        sql: sql_reg_centres,
        key: gtv.rci.API_KEY
      }
    }).done( function (response) {
      gtv.rci.reg_centres.set(response.rows);
    });
  };


  gtv.rci.columns.fetch();

  gtv.rci.admin_levels.fetch();

  
  console.log(gtv.rci);

})(jQuery);



// Other Functions

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}


function goToByScroll(id) {
  // Remove "link" from the ID
  id = id.replace("link", "");
  // Scroll
  $('html,body').animate({
        scrollTop: $('a[name="' + id + '"]').offset().top
      },
      'slow');
}

$("#jumbotron > a").click(function (e) {
  // Prevent a page reload when a link is pressed
  e.preventDefault();
  // Call the scroll function
  goToByScroll($(this).attr("id"));
});
