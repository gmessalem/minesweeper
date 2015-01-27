(function(angular) {
    'use strict';

    var module = angular.module('slidingPuzzle', []);

    /**
     * Service
     */
    module.factory('slidingPuzzle', function() {
        function shuffle(a) {
            var q;
            for (var j, x, i = a.length; i; j = parseInt(Math.random() * i, 10), x = a[--i], a[i] = a[j], a[j] = x) { q = 0; }
            return a;
        }

        function SlidingPuzzle(rows, cols, tot_num_of_mines) {
            /**
             * Puzzle grid
             * @type {Array}
             */
            this.grid = [];

            this.tot_num_of_mines = tot_num_of_mines;

            /**
             * Moves count
             * @type {Number}
             */
            this.mines = this.tot_num_of_mines;

            this.face = './img/facesmile.gif';

            this.num_unrevealed_tiles = cols * rows;

            /**
             * Uncover tile
             * @param row
             * @param col
             */
            this.uncover = function(row, col, is_initial_click, $event) {
                if (!this.grid[row][col].revealed || is_initial_click) {
                    if (!(is_initial_click && (this.grid[row][col].guess == 'flag') && $event.shiftKey)) {
                        if (!this.grid[row][col].is_bomb) {
                            if (!this.grid[row][col].revealed) {
                                var neighbors = this.grid[row][col].neighbors;
                                this.grid[row][col].style.background = "url('./img/open" + neighbors + ".gif') no-repeat";
                                this.grid[row][col].revealed = true;
                                this.num_unrevealed_tiles--;
                            }
                            if ((neighbors == 0) || (is_initial_click && $event.shiftKey)) {
                                //send to all the neighbors
                                for (var y = (row - 1 >= 0 ? row - 1 : row); y <= (row + 1 < rows ? row + 1 : row); y++) {
                                    for (var x = (col - 1 >= 0 ? col - 1 : col); x <= (col + 1 < cols ? col + 1 : col); x++) {
                                        if (!this.grid[y][x].revealed && this.grid[y][x].guess != 'flag') {
                                            this.uncover(y, x, false, $event);
                                        }
                                    }
                                }
                            }
                        } else {
                            this.show_bombs();
                        }
                    }
                }
            };

            /**
             * Show Bombs
             */
            this.show_bombs = function() {
                //show all of the bombs
                for (var y = 0; y < rows; y++) {
                    for (var x = 0; x < cols; x++) {
                        if (this.grid[y][x].is_bomb) {
                            this.grid[y][x].style.background = "url('./img/bombrevealed.gif') no-repeat";
                        }
                    }
                }
                this.mines = 0;
                this.face = "./img/facedead.gif";
            };

            /**
             * Marks tile
             * @param srow
             * @param scol
             */
            this.mark = function(tile,row, col) {
                //toggle tile marking
                var guess = this.grid[row][col].guess;
                var new_guess, new_background;

                new_guess = guess;
                new_background = tile.style.background;

                if (guess == 'none') {
                    if (this.mines > 0) {
                        new_guess = 'flag';
                        new_background = "url('./img/bombflagged.gif') no-repeat";
                        this.mines--;
                    } else {
                        alert("no more flags left!");
                    }
                } else if (guess == 'flag') {
                    new_guess = 'question';
                    new_background = "url('./img/bombquestion.gif') no-repeat";
                    this.mines++;
                } else if (guess == 'question') {
                    new_guess = 'none';
                    new_background = "url('./img/blank.gif') no-repeat";
                }

                this.grid[row][col].guess = new_guess;

                tile.style = {
                    background: new_background
                };

            };

            /**
             * Get the number of adjacent bombs
             */
            this.get_neighboring_bombs = function(row,col) {
                var neighboring_bombs = 0;
                if (!this.grid[row][col].is_bomb) {
                    for (var y = (row - 1 >= 0 ? row - 1 : row); y <= (row + 1 < rows ? row + 1 : row); y++) {
                        for (var x = (col - 1 >= 0 ? col - 1 : col); x<= (col + 1 < cols ? col + 1 : col); x++) {
                            if (this.grid[y][x].is_bomb) {
                                neighboring_bombs++;
                            }
                        }
                    }
                }
                return neighboring_bombs;
            }

            /**
             * Shuffles grid
             */
            this.shuffle = function() {
                var tiles = [];
                this.traverse(function(tile) {
                    tiles.push(tile);
                });
                shuffle(tiles);
                this.traverse(function(tile, row, col) {
                    this.grid[row][col] = tiles.shift();
                });

                this.mines = this.tot_num_of_mines;
                this.num_unrevealed_tiles = cols * rows;
                this.face = './img/facesmile.gif';

                for (var row = 0; row < rows; row++) {
                    for (var col = 0; col < cols; col++) {
                        if (this.grid[row][col].empty) {
                            this.grid[row][col].empty = false;
                        }
                        this.grid[row][col].neighbors = this.get_neighboring_bombs(row,col);
                    }
                }
            };

            /**
             * Is solved?
             * @type {Boolean}
             */
            this.isSolved = function() {
                var solved = (this.num_unrevealed_tiles - this.tot_num_of_mines + this.mines == 0);
                if (solved && (this.face != "./img/facedead.gif")) {
                    this.face = './img/facewin.gif';
                }
                return solved;
            };

            /**
             * Traverses grid and executes fn on every tile
             * @param fn
             */
            this.traverse = function(fn) {
                for (var row = 0; row < rows; row++) {
                    for (var col = 0; col < cols; col++) {
                        fn.call(this, this.grid && this.grid[row] ? this.grid[row][col] : undefined, row, col);
                    }
                }
            };

            // initialize grid
            var mines_left_here = this.tot_num_of_mines;
            this.traverse(function(tile, row, col) {
                if (!this.grid[row]) {
                    this.grid[row] = [];
                }
                this.grid[row][col] = {
                    empty: (row === rows - 1) && (col === cols - 1),
                    revealed: false,
                    neighbors: -1,
                    guess: 'none',
                    is_bomb: (mines_left_here-- > 0 ? true : false)
                };
                if (this.grid[row][col].empty) {
                    this.empty = this.grid[row][col];
                }
            });
        }

        return function(rows, cols, tot_num_of_mines) {
            return new SlidingPuzzle(rows, cols, tot_num_of_mines);
        };
    });

    /**
     * Directive
     */
    module.directive('slidingPuzzle', function(slidingPuzzle) {
        return {
            restrict: 'EA',
            replace: true,
            template: '<table class="sliding-puzzle" ng-class="{\'puzzle-solved\': puzzle.isSolved()}">' +
                '<tr ng-repeat="($row, row) in puzzle.grid">' +
                '<td ng-repeat="($col, tile) in row" ng-click="puzzle.uncover($row, $col, true, $event)" ng-right-click="puzzle.mark(tile,$row, $col)" ng-style="tile.style" ng-class="{\'puzzle-empty\': tile.empty}"></td>' +
                '</tr>' +
                '</table>',
            scope: {
                size: '@',
                src: '@',
                api: '='
            },
            link: function(scope, element, attrs) {
                var rows, cols, my_tot_num_of_mines,
                    loading = true,
                    image = new Image();

                function create() {
                    scope.puzzle = slidingPuzzle(rows, cols, my_tot_num_of_mines);

                    if (attrs.api) {
                        scope.api = scope.puzzle;
                    }

                    tile();
                }

                function tile() {
                    if (loading) {
                        return;
                    }

                    var width = 16;
                    var height = 16;

                    scope.puzzle.traverse(function(tile, row, col) {
                        tile.style = {
                            width: width + 'px',
                            height: height + 'px',
                            background: "url('./img/blank.gif') no-repeat"
                        };
                    });

                    scope.puzzle.shuffle();
                }

                attrs.$observe('size', function(size) {
                    size = size.split('x');
                    if (size[0] >= 2 && size[1] >= 2 && size[2]>0 && (size[2]<=size[0]*size[1])) {
                        rows = size[0];
                        cols = size[1];
                        my_tot_num_of_mines = size[2];
                        create();
                    }
                });

                attrs.$observe('src', function(src) {
                    loading = true;
                    image.src = src;
                    image.onload = function() {
                        loading = false;
                        scope.$apply(function() {
                            tile();
                        });
                    };
                });
            }
        };
    });
})(window.angular);
