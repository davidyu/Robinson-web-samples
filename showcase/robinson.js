var Camera = (function () {
    function Camera(position, aim, up, right) {
        this.matrix = gml.makeLookAt(position, aim, up, right);
    }
    Object.defineProperty(Camera.prototype, "pos", {
        get: function () {
            return this.matrix.row(3);
        },
        set: function (val) {
            this.matrix.setColumn(3, val);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "aim", {
        get: function () {
            return this.matrix.row(2);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "up", {
        get: function () {
            return this.matrix.row(1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "right", {
        get: function () {
            return this.matrix.row(0);
        },
        enumerable: true,
        configurable: true
    });
    return Camera;
})();
var gml;
(function (gml) {
    var Vector = (function () {
        function Vector(size) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.size = size;
            if (args.length === 1) {
                if (args[0] instanceof Float32Array) {
                    this.v = args[0];
                }
                else if (args[0] instanceof Array) {
                    this.v = new Float32Array(args[0]);
                }
            }
            else {
                this.v = new Float32Array(args);
            }
            if (this.v.length != this.size) {
                console.warn("input array " + args + " is not " + this.size + " elements long!");
            }
        }
        Vector.prototype.add = function (rhs) {
            if (this.size != rhs.size) {
                console.warn("rhs not " + this.size + " elements long!");
                return null;
            }
            var sum = [];
            for (var i = 0; i < this.size; i++) {
                sum.push(this.v[i] + rhs.v[i]);
            }
            return new Vector(this.size, sum);
        };
        Vector.prototype.subtract = function (rhs) {
            if (this.size != rhs.size) {
                console.warn("rhs not " + this.size + " elements long!");
                return null;
            }
            var diff = [];
            for (var i = 0; i < this.size; i++) {
                diff.push(this.v[i] - rhs.v[i]);
            }
            return new Vector(this.size, diff);
        };
        Vector.prototype.multiply = function (s) {
            var scaled = [];
            for (var i = 0; i < this.size; i++) {
                scaled.push(this.v[i] * s);
            }
            return new Vector(this.size, scaled);
        };
        Vector.prototype.divide = function (d) {
            var divided = [];
            for (var i = 0; i < this.size; i++) {
                divided.push(this.v[i] / d);
            }
            return new Vector(this.size, divided);
        };
        Vector.prototype.negate = function () {
            var negated = [];
            for (var i = 0; i < this.size; i++) {
                negated.push(-this.v[i]);
            }
            return new Vector(this.size, negated);
        };
        Vector.prototype.dot = function (rhs) {
            if (this.size != rhs.size) {
                console.warn("rhs not " + this.size + " elements long!");
                return null;
            }
            var dp = 0;
            for (var i = 0; i < this.size; i++) {
                dp += this.v[0] * rhs.v[0];
            }
        };
        Vector.prototype.equals = function (b) {
            if (this.size != b.size)
                return false;
            for (var i = 0; i < this.size; i++) {
                if (this.v[i] != b.v[i])
                    return false;
            }
            return true;
        };
        Object.defineProperty(Vector.prototype, "len", {
            get: function () {
                return Math.sqrt(this.lensq);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector.prototype, "lensq", {
            get: function () {
                var acc = 0;
                for (var i = 0; i < this.v.length; i++) {
                    acc += this.v[i] * this.v[i];
                }
                return acc;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * NOTE: this alters the underlying vector. For construction of
         * a new normalized vector, use the vector.normalized property.
         */
        Vector.prototype.normalize = function () {
            var l = this.len;
            this.v = this.v.map(function (v) {
                return v / l;
            });
        };
        Object.defineProperty(Vector.prototype, "normalized", {
            get: function () {
                var l = this.len;
                var vs = [];
                for (var i = 0; i < this.size; i++) {
                    vs.push(this.v[i] / l);
                }
                return new Vector(vs.unshift(this.size));
            },
            enumerable: true,
            configurable: true
        });
        Vector.prototype.map = function (callback) {
            return new Vector(this.size, this.v.map(callback));
        };
        Vector.prototype.toString = function () {
            var str = "";
            for (var i = 0; i < this.size; i++) {
                str += this.v[i] + ",";
            }
            return str.slice(0, -1);
        };
        return Vector;
    })();
    gml.Vector = Vector;
})(gml || (gml = {}));
///<reference path="vec.ts"/>
var gml;
(function (gml) {
    var Matrix = (function () {
        function Matrix(rows, cols) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.rows = rows;
            this.cols = cols;
            if (args.length == 1) {
                if (args[0] instanceof Float32Array) {
                    this.v = args[0];
                }
                else if (args[0] instanceof Array) {
                    this.v = new Float32Array(args[0]);
                }
            }
            else {
                this.v = new Float32Array(args);
            }
            if (this.v.length != this.rows * this.cols) {
                console.warn("input values " + args + " is not " + this.rows * this.cols + " elements long!");
            }
        }
        Matrix.prototype.transpose_Float32Array = function (values, rows, cols) {
            var out = new Float32Array(rows * cols);
            for (var i = 0; i < cols; i++) {
                for (var j = 0; j < rows; j++) {
                    out[i * cols + j] = values[j * cols + i];
                }
            }
            return out;
        };
        Matrix.prototype.transpose = function () {
            return new Matrix(this.cols, this.rows, this.transpose_Float32Array(this.v, this.rows, this.cols));
        };
        Matrix.prototype.get = function (r, c) {
            return this.v[r * this.cols + c];
        };
        Matrix.prototype.set = function (r, c, val) {
            this.v[r * this.cols + c] = val;
        };
        Matrix.prototype.row = function (r) {
            var row = [];
            for (var i = 0; i < this.cols; i++) {
                row.push(this.get(r, i));
            }
            return new gml.Vector(this.cols, row);
        };
        Matrix.prototype.column = function (c) {
            var column = [];
            for (var i = 0; i < this.rows; i++) {
                column.push(this.get(i, c));
            }
            return new gml.Vector(this.rows, column);
        };
        /**
         * Sets a row in the matrix.
         * @param r   the row index
         * @param row the new contents of the row
         */
        Matrix.prototype.setRow = function (r, row) {
            for (var i = 0; i < this.cols; i++) {
                this.set(r, i, row.v[i]);
            }
        };
        /**
         * Sets a column in the matrix.
         * @param c   the column index
         * @param col the new contents of the column
         */
        Matrix.prototype.setColumn = function (c, col) {
            for (var i = 0; i < this.rows; i++) {
                this.set(i, c, col.v[i]);
            }
        };
        /**
         * Swaps two rows in the matrix.
         */
        Matrix.prototype.swapRows = function (r1, r2) {
            var row1 = this.row(r1);
            var row2 = this.row(r2);
            this.setRow(r2, row1);
            this.setRow(r1, row2);
        };
        Object.defineProperty(Matrix.prototype, "trace", {
            /**
             * NOTE: a trace is only defined for square matrices.
             * If you try to acquire the trace of a nonsquare matrix, the library
             * will not stop you or throw an excpetion, but the result will be
             * undefined/incorrect.
             */
            get: function () {
                var tr = 0;
                for (var i = 0; i < this.rows; i++) {
                    tr += this.get(i, i);
                }
                return tr;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @returns The LU decomposition of the matrix. If no such decomposition
         * exists, the l and u properties of the return object are both null.
         *
         * This implementation of LU decomposition uses the Doolittle algorithm.
         */
        Matrix.prototype.lu = function () {
            if (this.rows != this.cols) {
                console.warn("matrix not square; cannot perform LU decomposition!");
                return { l: null, u: null };
            }
            var l = Matrix.identity(this.rows);
            var u = new Matrix(this.rows, this.cols, this.v);
            var size = this.rows;
            // apply doolittle algorithm
            for (var n = 0; n < size; n++) {
                var l_i = Matrix.identity(size);
                var l_i_inv = Matrix.identity(size);
                // when multiplied with u, l_i eliminates elements below the main diagonal in the n-th column of matrix u
                // l_i_inv is the inverse to l_i, and is very easy to construct if we already have l_i
                // partial pivot
                if (u.get(n, n) == 0) {
                    var success = false;
                    for (var j = n + 1; j < size; j++) {
                        if (u.get(j, n) != 0) {
                            u.swapRows(n, j);
                            success = true;
                            break;
                        }
                    }
                    if (!success) {
                        console.warn("matrix is singular; cannot perform LU decomposition!");
                        return { l: null, u: null };
                    }
                }
                for (var i = n + 1; i < size; i++) {
                    var l_i_n = -u.get(i, n) / u.get(n, n);
                    l_i.set(i, n, l_i_n);
                    l_i_inv.set(i, n, -l_i_n);
                }
                l = l.multiply(l_i_inv);
                u = l_i.multiply(u);
            }
            return { l: l, u: u };
        };
        Object.defineProperty(Matrix.prototype, "determinant", {
            /**
             * @returns the determinant of the matrix, if it is square.
             *
             * NOTE: If you try to acquire the determinant of a nonsquare matrix,
             * the result returned will be 0.
             *
             * If the LU decomposition of the matrix fails (IE: the matrix is linearly
             * dependent in terms of its row vectors or columns vectors), the result
             * returned will be 0.
             */
            get: function () {
                if (this.rows != this.cols) {
                    return 0;
                }
                var _a = this.lu(), l = _a.l, u = _a.u;
                if (l == null || u == null) {
                    return 0;
                }
                var det = 1;
                for (var i = 0; i < this.rows; i++) {
                    det *= u.get(i, i);
                }
                return det;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Componentwise addition of two matrices. Does not alter the original matrix.
         *
         * @returns a new matrix resulting from the addition
         */
        Matrix.prototype.add = function (rhs) {
            var vs = [];
            var rvs = rhs.v;
            for (var i = 0; i < this.v.length; i++) {
                vs.push(this.v[i] + rvs[i]);
            }
            return new Matrix(this.rows, this.cols, vs);
        };
        /**
         * Componentwise subtraction of two matrices. Does not alter the original matrix.
         *
         * @returns a new matrix resulting from the subtraction operation this - rhs
         */
        Matrix.prototype.subtract = function (rhs) {
            var vs = [];
            var rvs = rhs.v;
            for (var i = 0; i < this.v.length; i++) {
                vs.push(this.v[i] - rvs[i]);
            }
            return new Matrix(this.rows, this.cols, vs);
        };
        Matrix.prototype.multiply = function (arg) {
            if (arg instanceof Matrix) {
                return Matrix.matmul(this, arg);
            }
            else {
                return this.scalarmul(arg);
            }
        };
        Matrix.prototype.scalarmul = function (s) {
            var vs = [];
            for (var i = 0; i < this.v.length; i++) {
                vs.push(this.v[i] * s);
            }
            return new Matrix(this.rows, this.cols, vs);
        };
        Matrix.matmul = function (lhs, rhs) {
            if (lhs.rows != rhs.cols) {
                console.warn("lhs and rhs incompatible for matrix multiplication!");
                return null;
            }
            var out = [];
            for (var i = 0; i < lhs.rows; i++) {
                for (var j = 0; j < rhs.cols; j++) {
                    var sum = 0;
                    for (var k = 0; k < lhs.cols; k++) {
                        sum += lhs.get(i, k) * rhs.get(k, j);
                    }
                    out[i * lhs.cols + j] = sum;
                }
            }
            return new Matrix(lhs.rows, rhs.cols, out);
        };
        Matrix.identity = function (size) {
            var v = [];
            for (var i = 0; i < size; i++) {
                for (var j = 0; j < size; j++) {
                    if (i == j)
                        v.push(1);
                    else
                        v.push(0);
                }
            }
            return new Matrix(size, size, v);
        };
        Matrix.prototype.toString = function () {
            var str = "";
            for (var i = 0; i < this.rows; i++) {
                str += "\n\t";
                for (var j = 0; j < this.cols; j++) {
                    var v = this.get(i, j);
                    str += v.toPrecision(8) + "\t";
                }
                str = str.slice(0, -1);
                str += "\n";
            }
            str = str.slice(0, -1);
            str += "\n";
            return str;
        };
        Matrix.prototype.toWolframString = function () {
            var str = "{";
            for (var i = 0; i < this.rows; i++) {
                str += "{";
                for (var j = 0; j < this.cols; j++) {
                    str += this.get(i, j) + ",";
                }
                str = str.slice(0, -1);
                str += "},";
            }
            str = str.slice(0, -1);
            str += "}";
            return str;
        };
        Object.defineProperty(Matrix.prototype, "m", {
            /**
             * @returns The contents of the matrix, stored in column-major order and
             * encoded as a Float32Array.
             */
            get: function () {
                return this.transpose_Float32Array(this.v, this.rows, this.cols);
            },
            enumerable: true,
            configurable: true
        });
        return Matrix;
    })();
    gml.Matrix = Matrix;
})(gml || (gml = {}));
///<reference path="../mat.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gml2d;
(function (gml2d) {
    /**
     *
     * @preferred
     *
     * an homogenous 2D transformation matrix (with rotations in theta specified in CCW):
     *
     * <pre>
     * sx * cos(theta),-sx * sin(theta), tx
     * sy * sin(theta), sy * cos(theta), ty
     * 0              , 0              ,  1
     * </pre>
     */
    /*
      from this, given a mat3:
  
      a b tx
      c d ty
      0 0 1
  
      we can derive:
  
      sx = sqrt( a*a + b*b )
      sy = sqrt( c*c + d*d )
  
      theta = atan( b/a ) or atan( -c/d ) with some caveats
    */
    var Mat3 = (function (_super) {
        __extends(Mat3, _super);
        function Mat3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _super.call(this, 3, 3, args);
        }
        Object.defineProperty(Mat3.prototype, "r00", {
            get: function () {
                return this.get(0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r01", {
            get: function () {
                return this.get(0, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r10", {
            get: function () {
                return this.get(1, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r11", {
            get: function () {
                return this.get(1, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "m20", {
            get: function () {
                return this.get(2, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r21", {
            get: function () {
                return this.get(2, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r22", {
            get: function () {
                return this.get(2, 2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "tx", {
            get: function () {
                return this.get(0, 2);
            },
            set: function (v) {
                this.set(0, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "ty", {
            get: function () {
                return this.get(1, 2);
            },
            set: function (v) {
                this.set(1, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "rotation", {
            // slow public rotation accessor
            get: function () {
                var a = this.get(0, 0); // cos term
                var b = this.get(0, 1); // sin term
                // when 90 < rot <= 270, atan returns  rot-180 (atan returns results in the [ -90, 90 ] range), so correct it
                if (a < 0) {
                    return gml.fromRadians(Math.atan(b / a) + Math.PI);
                }
                else {
                    return gml.fromRadians(Math.atan(b / a));
                }
            },
            set: function (v) {
                var rad = v.toRadians();
                var sx = this.sx;
                var sy = this.sy;
                this.set(0, 0, sx * Math.cos(rad));
                this.set(0, 1, -sx * Math.sin(rad));
                this.set(1, 0, sy * Math.sin(rad));
                this.set(1, 1, sy * Math.cos(rad));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "rot_rad", {
            // internal accessor
            get: function () {
                var a = this.get(0, 0); // cos term
                var b = this.get(0, 1); // sin term
                if (a < 0) {
                    return Math.atan(b / a) + Math.PI;
                }
                else {
                    return Math.atan(b / a);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "sx", {
            get: function () {
                var a = this.get(0, 0);
                var b = this.get(0, 1);
                return Math.sqrt(a * a + b * b);
            },
            set: function (v) {
                var rad = this.rot_rad;
                this.set(0, 0, v * Math.cos(rad));
                this.set(0, 1, -v * Math.sin(rad));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "sy", {
            get: function () {
                var c = this.get(1, 0);
                var d = this.get(1, 1);
                return Math.sqrt(c * c + d * d);
            },
            set: function (v) {
                var rad = this.rot_rad;
                this.set(1, 0, v * Math.sin(rad));
                this.set(1, 1, v * Math.cos(rad));
            },
            enumerable: true,
            configurable: true
        });
        Mat3.prototype.row = function (r) {
            var row = [];
            for (var i = 0; i < 3; i++) {
                row.push(this.get(r, i));
            }
            return new gml2d.Vec3(row);
        };
        Mat3.prototype.column = function (c) {
            var column = [];
            for (var i = 0; i < 3; i++) {
                column.push(this.get(i, c));
            }
            return new gml2d.Vec3(column);
        };
        Mat3.prototype.multiply = function (arg) {
            var m = _super.prototype.multiply.call(this, arg);
            return new Mat3(m.m);
        };
        Mat3.identity = function () {
            return new Mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);
        };
        Mat3.fromRows = function (r1, r2, r3) {
            return new Mat3(r1.x, r1.y, r1.w, r2.x, r2.y, r2.w, r3.x, r3.y, r3.w);
        };
        Mat3.fromCols = function (c1, c2, c3) {
            return new Mat3(c1.x, c2.x, c3.x, c1.y, c2.y, c3.y, c1.w, c2.w, c3.w);
        };
        return Mat3;
    })(gml.Matrix);
    gml2d.Mat3 = Mat3;
})(gml2d || (gml2d = {}));
///<reference path="../vec.ts"/>
/**
 * The gml2d library is mostly designed with 2D usage (games/visualization)
 * in mind.
 */
var gml2d;
(function (gml2d) {
    var Vec2 = (function (_super) {
        __extends(Vec2, _super);
        function Vec2() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length == 2) {
                _super.call(this, 2, args[0], args[1]);
            }
            else if (args.length == 1) {
                _super.call(this, 2, args[0]);
            }
        }
        Object.defineProperty(Vec2.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec2.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Vec2.prototype.add = function (rhs) {
            return new Vec2(this.x + rhs.x, this.y + rhs.y);
        };
        Vec2.prototype.subtract = function (rhs) {
            return new Vec2(this.x - rhs.x, this.y - rhs.y);
        };
        Vec2.prototype.multiply = function (s) {
            return new Vec2(this.x * s, this.y * s);
        };
        Vec2.prototype.divide = function (d) {
            return new Vec2(this.x / d, this.y / d);
        };
        Vec2.prototype.negate = function () {
            return new Vec2(-this.x, -this.y);
        };
        Vec2.prototype.dot = function (rhs) {
            return this.x * rhs.x + this.y * rhs.y;
        };
        Object.defineProperty(Vec2.prototype, "normalized", {
            get: function () {
                var len = this.len;
                return new Vec2(this.x / len, this.y / len);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Computes the '2D' cross product
         */
        Vec2.prototype.cross = function (rhs) {
            return this.x * rhs.y - this.y * rhs.x;
        };
        Vec2.prototype.map = function (callback) {
            return new Vec2(this.v.map(callback));
        };
        Vec2.randomInCircle = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec2(Math.random(), Math.random()).normalized.multiply(radius);
        };
        Object.defineProperty(Vec2, "zero", {
            get: function () {
                return new Vec2(0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec2;
    })(gml.Vector);
    gml2d.Vec2 = Vec2;
})(gml2d || (gml2d = {}));
///<reference path="../vec.ts"/>
var gml2d;
(function (gml2d) {
    /**
     * A 2D homogenous vector (x, y, w) representing the point (x/w, y/w) or the
     * vector (x,y)
     */
    var Vec3 = (function (_super) {
        __extends(Vec3, _super);
        function Vec3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length == 3) {
                _super.call(this, 3, args[0], args[1], args[2]);
            }
            else if (args.length == 1) {
                _super.call(this, 3, args[0]);
            }
        }
        Object.defineProperty(Vec3.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "w", {
            get: function () {
                return this.v[2];
            },
            set: function (w) {
                this.v[2] = w;
            },
            enumerable: true,
            configurable: true
        });
        Vec3.prototype.add = function (rhs) {
            return new Vec3(this.x + rhs.x, this.y + rhs.y, this.w + rhs.w);
        };
        Vec3.prototype.subtract = function (rhs) {
            return new Vec3(this.x - rhs.x, this.y - rhs.y, this.w - rhs.w);
        };
        Vec3.prototype.multiply = function (s) {
            return new Vec3(this.x * s, this.y * s, this.w * s);
        };
        Vec3.prototype.divide = function (d) {
            return new Vec3(this.x / d, this.y / d, this.w / d);
        };
        Vec3.prototype.negate = function () {
            return new Vec3(-this.x, -this.y, -this.w);
        };
        Vec3.prototype.dot = function (rhs) {
            return this.x * rhs.x + this.y * rhs.y + this.w * rhs.w;
        };
        /**
         * Computes the '2D' cross product as if this were a 2D vector (Vec2)
         */
        Vec3.prototype.cross = function (rhs) {
            return this.x * rhs.y - this.y * rhs.x;
        };
        Object.defineProperty(Vec3.prototype, "normalized", {
            get: function () {
                var len = this.len;
                return new Vec3(this.x / len, this.y / len, this.w / len);
            },
            enumerable: true,
            configurable: true
        });
        Vec3.prototype.map = function (callback) {
            return new Vec3(this.v.map(callback));
        };
        /**
         * @returns a random directional Vec3 in a user-specified circle centered around the origin.
         *          Note that the w-component of the Vec3 is 0.
         */
        Vec3.randomInCircle = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec3(Math.random(), Math.random(), 0).normalized.multiply(radius);
        };
        /**
         * @returns a random positional Vec3 in a user-specified circle centered around the origin.
         *          Note that the w-component of the Vec3 is 1.
         */
        Vec3.randomPositionInCircle = function (radius) {
            if (radius === void 0) { radius = 1; }
            var random = new Vec3(Math.random(), Math.random(), 0).normalized.multiply(radius);
            random.w = 1;
            return random;
        };
        Object.defineProperty(Vec3, "zero", {
            get: function () {
                return new Vec3(0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec3;
    })(gml.Vector);
    gml2d.Vec3 = Vec3;
})(gml2d || (gml2d = {}));
///<reference path="../mat.ts"/>
var gml;
(function (gml) {
    var Mat3 = (function (_super) {
        __extends(Mat3, _super);
        function Mat3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length === 1) {
                _super.call(this, 3, 3, args[0]);
            }
            else {
                _super.call(this, 3, 3, args);
            }
        }
        Object.defineProperty(Mat3.prototype, "r00", {
            get: function () {
                return this.get(0, 0);
            },
            set: function (v) {
                this.set(0, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r01", {
            get: function () {
                return this.get(0, 1);
            },
            set: function (v) {
                this.set(0, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r02", {
            get: function () {
                return this.get(0, 2);
            },
            set: function (v) {
                this.set(0, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r10", {
            get: function () {
                return this.get(1, 0);
            },
            set: function (v) {
                this.set(1, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r11", {
            get: function () {
                return this.get(1, 1);
            },
            set: function (v) {
                this.set(1, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r12", {
            get: function () {
                return this.get(1, 2);
            },
            set: function (v) {
                this.set(1, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r20", {
            get: function () {
                return this.get(2, 0);
            },
            set: function (v) {
                this.set(2, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r21", {
            get: function () {
                return this.get(2, 1);
            },
            set: function (v) {
                this.set(2, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat3.prototype, "r22", {
            get: function () {
                return this.get(2, 2);
            },
            set: function (v) {
                this.set(2, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Mat3.prototype.row = function (r) {
            var row = [];
            for (var i = 0; i < 3; i++) {
                row.push(this.get(r, i));
            }
            return new gml.Vec3(row);
        };
        Mat3.prototype.column = function (c) {
            var column = [];
            for (var i = 0; i < 3; i++) {
                column.push(this.get(i, c));
            }
            return new gml.Vec3(column);
        };
        Mat3.prototype.multiply = function (arg) {
            var m = _super.prototype.multiply.call(this, arg);
            return new Mat3(m.v);
        };
        Mat3.prototype.scalarmul = function (s) {
            var m = _super.prototype.scalarmul.call(this, s);
            return new Mat3(m.v);
        };
        Mat3.prototype.subtract = function (rhs) {
            var m = _super.prototype.subtract.call(this, rhs);
            return new Mat3(m.v);
        };
        Mat3.prototype.add = function (rhs) {
            var m = _super.prototype.add.call(this, rhs);
            return new Mat3(m.v);
        };
        Mat3.prototype.transpose = function () {
            return new Mat3(_super.prototype.transpose.call(this).v);
        };
        Mat3.prototype.transform = function (rhs) {
            return new gml.Vec3(this.r00 * rhs.x + this.r01 * rhs.y + this.r02 * rhs.z, this.r10 * rhs.x + this.r11 * rhs.y + this.r12 * rhs.z, this.r20 * rhs.x + this.r21 * rhs.y + this.r22 * rhs.z);
        };
        /**
         * constructs a Mat4 with the contents of this Mat3 forming the top-left
         * portion of the new Mat4. The translation portion of the new Mat4 is assumed
         * to be zero.
         *
         * E.G.:
         * <pre>
         * a b c       a b c 0
         * d e f  -->  d e f 0
         * g h i       g h i 0
         *             0 0 0 1
         * </pre>
         */
        Mat3.prototype.toMat4 = function () {
            return new gml.Mat4(this.r00, this.r01, this.r02, 0, this.r10, this.r11, this.r12, 0, this.r20, this.r21, this.r22, 0, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around the Y axis, IE yaw.
         * @param angle the angle to rotate around the Y-axis by (rotation is counter-clockwise).
         */
        Mat3.rotateY = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat3(c, 0, -s, 0, 1, 0, s, 0, c);
        };
        /**
         * constructs a matrix representing a rotation around the X axis, IE pitch.
         * @param angle the angle to rotate around the X-axis by (rotation is counter-clockwise).
         */
        Mat3.rotateX = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat3(1, 0, 0, 0, c, s, 0, -s, c);
        };
        /**
         * constructs a matrix representing a rotation around the Z axis, IE roll.
         * @param angle the angle to rotate around the Z-axis by (rotation is counter-clockwise).
         */
        Mat3.rotateZ = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat3(c, s, 0, -s, c, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around a user-specified axis.
         * @param axis  the axis of rotation.
         * @param angle the angle to rotate around the axis by (rotation is counter-clockwise).
         */
        Mat3.rotate = function (axis, angle) {
            var k = new Mat3(0, -axis.z, axis.y, axis.z, 0, -axis.x, -axis.y, axis.x, 0);
            var k2 = k.multiply(k);
            var r = angle.toRadians();
            return Mat3.identity()
                .add(k.multiply(Math.sin(r)))
                .add(k2.multiply(1 - Math.cos(r)));
        };
        Mat3.identity = function () {
            return new Mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);
        };
        Mat3.fromRows = function (r1, r2, r3) {
            return new Mat3(r1.x, r1.y, r1.z, r2.x, r2.y, r2.z, r3.x, r3.y, r3.z);
        };
        Mat3.fromCols = function (c1, c2, c3) {
            return new Mat3(c1.x, c2.x, c3.x, c1.y, c2.y, c3.y, c1.z, c2.z, c3.z);
        };
        return Mat3;
    })(gml.Matrix);
    gml.Mat3 = Mat3;
})(gml || (gml = {}));
///<reference path="../mat.ts"/>
var gml;
(function (gml) {
    var Mat4 = (function (_super) {
        __extends(Mat4, _super);
        function Mat4() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length === 1) {
                _super.call(this, 4, 4, args[0]);
            }
            else {
                _super.call(this, 4, 4, args);
            }
        }
        Object.defineProperty(Mat4.prototype, "r00", {
            get: function () {
                return this.get(0, 0);
            },
            set: function (v) {
                this.set(0, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r01", {
            get: function () {
                return this.get(0, 1);
            },
            set: function (v) {
                this.set(0, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r02", {
            get: function () {
                return this.get(0, 2);
            },
            set: function (v) {
                this.set(0, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r10", {
            get: function () {
                return this.get(1, 0);
            },
            set: function (v) {
                this.set(1, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r11", {
            get: function () {
                return this.get(1, 1);
            },
            set: function (v) {
                this.set(1, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r12", {
            get: function () {
                return this.get(1, 2);
            },
            set: function (v) {
                this.set(1, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r20", {
            get: function () {
                return this.get(2, 0);
            },
            set: function (v) {
                this.set(2, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r21", {
            get: function () {
                return this.get(2, 1);
            },
            set: function (v) {
                this.set(2, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "r22", {
            get: function () {
                return this.get(2, 2);
            },
            set: function (v) {
                this.set(2, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "m30", {
            get: function () {
                return this.get(3, 0);
            },
            set: function (v) {
                this.set(3, 0, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "m31", {
            get: function () {
                return this.get(3, 1);
            },
            set: function (v) {
                this.set(3, 1, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "m32", {
            get: function () {
                return this.get(3, 2);
            },
            set: function (v) {
                this.set(3, 2, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "m33", {
            get: function () {
                return this.get(3, 3);
            },
            set: function (v) {
                this.set(3, 3, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "tx", {
            get: function () {
                return this.get(0, 3);
            },
            set: function (v) {
                this.set(0, 3, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "ty", {
            get: function () {
                return this.get(1, 3);
            },
            set: function (v) {
                this.set(1, 3, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "tz", {
            get: function () {
                return this.get(2, 3);
            },
            set: function (v) {
                this.set(2, 3, v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "w", {
            get: function () {
                return this.get(3, 3);
            },
            set: function (v) {
                this.set(3, 3, v);
            },
            enumerable: true,
            configurable: true
        });
        Mat4.prototype.row = function (r) {
            var row = [];
            for (var i = 0; i < 4; i++) {
                row.push(this.get(r, i));
            }
            return new gml.Vec4(row);
        };
        Mat4.prototype.column = function (c) {
            var column = [];
            for (var i = 0; i < 4; i++) {
                column.push(this.get(i, c));
            }
            return new gml.Vec4(column);
        };
        Object.defineProperty(Mat4.prototype, "translation", {
            get: function () {
                return this.column(3);
            },
            set: function (t) {
                this.setColumn(3, t);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mat4.prototype, "scale", {
            get: function () {
                return new gml.Vec3(this.get(0, 0), this.get(1, 1), this.get(2, 2));
            },
            set: function (s) {
                this.set(0, 0, s.x);
                this.set(1, 1, s.y);
                this.set(2, 2, s.z);
            },
            enumerable: true,
            configurable: true
        });
        Mat4.prototype.multiply = function (arg) {
            if (arg instanceof Mat4) {
                return Mat4.matmul(this, arg);
            }
            else {
                return this.scalarmul(arg);
            }
        };
        Mat4.prototype.scalarmul = function (s) {
            return new Mat4(this.v[0] * s, this.v[1] * s, this.v[2] * s, this.v[3] * s, this.v[4] * s, this.v[5] * s, this.v[6] * s, this.v[7] * s, this.v[8] * s, this.v[9] * s, this.v[10] * s, this.v[11] * s, this.v[12] * s, this.v[13] * s, this.v[14] * s, this.v[15] * s);
        };
        Mat4.prototype.subtract = function (rhs) {
            return new Mat4(this.v[0] - rhs.v[0], this.v[1] - rhs.v[1], this.v[2] - rhs.v[2], this.v[3] - rhs.v[3], this.v[4] - rhs.v[4], this.v[5] - rhs.v[5], this.v[6] - rhs.v[6], this.v[7] - rhs.v[7], this.v[8] - rhs.v[8], this.v[9] - rhs.v[9], this.v[10] - rhs.v[10], this.v[11] - rhs.v[11], this.v[12] - rhs.v[12], this.v[13] - rhs.v[13], this.v[14] - rhs.v[14], this.v[15] - rhs.v[15]);
        };
        Mat4.prototype.add = function (rhs) {
            return new Mat4(this.v[0] + rhs.v[0], this.v[1] + rhs.v[1], this.v[2] + rhs.v[2], this.v[3] + rhs.v[3], this.v[4] + rhs.v[4], this.v[5] + rhs.v[5], this.v[6] + rhs.v[6], this.v[7] + rhs.v[7], this.v[8] + rhs.v[8], this.v[9] + rhs.v[9], this.v[10] + rhs.v[10], this.v[11] + rhs.v[11], this.v[12] + rhs.v[12], this.v[13] + rhs.v[13], this.v[14] + rhs.v[14], this.v[15] + rhs.v[15]);
        };
        Mat4.prototype.transform = function (rhs) {
            return new gml.Vec4(this.r00 * rhs.x + this.r01 * rhs.y + this.r02 * rhs.z + this.tx * rhs.w, this.r10 * rhs.x + this.r11 * rhs.y + this.r12 * rhs.z + this.ty * rhs.w, this.r20 * rhs.x + this.r21 * rhs.y + this.r22 * rhs.z + this.tz * rhs.w, this.m30 * rhs.x + this.m31 * rhs.y + this.m32 * rhs.z + this.m33 * rhs.w);
        };
        Mat4.prototype.invert = function () {
            var d = this.determinant;
            var tr = this.trace;
            var m2 = this.multiply(this);
            var m3 = this.multiply(m2);
            var tr2 = m2.trace;
            var tr3 = m3.trace;
            var a = (1 / 6) * ((tr * tr * tr) - (3 * tr * tr2) + (2 * tr3));
            var b = (1 / 2) * (tr * tr - tr2);
            var c = m2.scalarmul(tr).subtract(m3);
            return Mat4.identity().scalarmul(a).subtract(this.scalarmul(b)).add(c).scalarmul(1 / d);
        };
        Object.defineProperty(Mat4.prototype, "determinant", {
            /**
             * @returns the determinant of Mat4.
             *
             * Hand-rolled for Mat4 to avoid call to Mat.LU, which is unoptimized and
             * expensive for real-time applications.
             */
            get: function () {
                var m00 = this.v[0];
                var m01 = this.v[1];
                var m02 = this.v[2];
                var m03 = this.v[3];
                var m10 = this.v[4];
                var m11 = this.v[5];
                var m12 = this.v[6];
                var m13 = this.v[7];
                var m20 = this.v[8];
                var m21 = this.v[9];
                var m22 = this.v[10];
                var m23 = this.v[11];
                var m30 = this.v[12];
                var m31 = this.v[13];
                var m32 = this.v[14];
                var m33 = this.v[15];
                return m03 * m12 * m21 * m30 - m02 * m13 * m21 * m30 - m03 * m11 * m22 * m30 + m01 * m13 * m22 * m30 +
                    m02 * m11 * m23 * m30 - m01 * m12 * m23 * m30 - m03 * m12 * m20 * m31 + m02 * m13 * m20 * m31 +
                    m03 * m10 * m22 * m31 - m00 * m13 * m22 * m31 - m02 * m10 * m23 * m31 + m00 * m12 * m23 * m31 +
                    m03 * m11 * m20 * m32 - m01 * m13 * m20 * m32 - m03 * m10 * m21 * m32 + m00 * m13 * m21 * m32 +
                    m01 * m10 * m23 * m32 - m00 * m11 * m23 * m32 - m02 * m11 * m20 * m33 + m01 * m12 * m20 * m33 +
                    m02 * m10 * m21 * m33 - m00 * m12 * m21 * m33 - m01 * m10 * m22 * m33 + m00 * m11 * m22 * m33;
            },
            enumerable: true,
            configurable: true
        });
        Mat4.prototype.transpose = function () {
            return new Mat4(_super.prototype.transpose.call(this).v);
        };
        Object.defineProperty(Mat4.prototype, "mat3", {
            get: function () {
                return new gml.Mat3(this.r00, this.r01, this.r02, this.r10, this.r11, this.r12, this.r20, this.r21, this.r22);
            },
            enumerable: true,
            configurable: true
        });
        Mat4.identity = function () {
            return new Mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around the Y axis, IE yaw.
         * @param angle the angle to rotate around the Y-axis by (rotation is counter-clockwise).
         */
        Mat4.rotateY = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat4(c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around the X axis, IE pitch.
         * @param angle the angle to rotate around the X-axis by (rotation is counter-clockwise).
         */
        Mat4.rotateX = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat4(1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around the Z axis, IE roll.
         * @param angle the angle to rotate around the Z-axis by (rotation is counter-clockwise).
         */
        Mat4.rotateZ = function (angle) {
            var s = Math.sin(angle.toRadians());
            var c = Math.cos(angle.toRadians());
            return new Mat4(c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * constructs a matrix representing a rotation around a user-specified axis.
         * @param axis  the axis of rotation.
         * @param angle the angle to rotate around the axis by (rotation is counter-clockwise).
         */
        Mat4.rotate = function (axis, angle) {
            var k = new Mat4(0, -axis.z, axis.y, 0, axis.z, 0, -axis.x, 0, -axis.y, axis.x, 0, 0, 0, 0, 0, 0);
            var k2 = k.multiply(k);
            var r = angle.toRadians();
            return Mat4.identity()
                .add(k.multiply(Math.sin(r)))
                .add(k2.multiply(1 - Math.cos(r)));
        };
        /**
         * constructs a matrix representing a translation.
         */
        Mat4.translate = function (v) {
            return new Mat4(1, 0, 0, v.x, 0, 1, 0, v.y, 0, 0, 1, v.z, 0, 0, 0, 1);
        };
        Mat4.fromRows = function (r1, r2, r3, r4) {
            return new Mat4(r1.x, r1.y, r1.z, r1.w, r2.x, r2.y, r2.z, r2.w, r3.x, r3.y, r3.z, r3.w, r4.x, r4.y, r4.z, r4.w);
        };
        Mat4.fromCols = function (c1, c2, c3, c4) {
            return new Mat4(c1.x, c2.x, c3.x, c4.x, c1.y, c2.y, c3.y, c4.y, c1.z, c2.z, c3.z, c4.z, c1.w, c2.w, c3.w, c4.w);
        };
        Mat4.matmul = function (lhs, rhs) {
            var l00 = lhs.v[0];
            var l01 = lhs.v[1];
            var l02 = lhs.v[2];
            var l03 = lhs.v[3];
            var l10 = lhs.v[4];
            var l11 = lhs.v[5];
            var l12 = lhs.v[6];
            var l13 = lhs.v[7];
            var l20 = lhs.v[8];
            var l21 = lhs.v[9];
            var l22 = lhs.v[10];
            var l23 = lhs.v[11];
            var l30 = lhs.v[12];
            var l31 = lhs.v[13];
            var l32 = lhs.v[14];
            var l33 = lhs.v[15];
            var r00 = rhs.v[0];
            var r01 = rhs.v[1];
            var r02 = rhs.v[2];
            var r03 = rhs.v[3];
            var r10 = rhs.v[4];
            var r11 = rhs.v[5];
            var r12 = rhs.v[6];
            var r13 = rhs.v[7];
            var r20 = rhs.v[8];
            var r21 = rhs.v[9];
            var r22 = rhs.v[10];
            var r23 = rhs.v[11];
            var r30 = rhs.v[12];
            var r31 = rhs.v[13];
            var r32 = rhs.v[14];
            var r33 = rhs.v[15];
            return new Mat4(l00 * r00 + l01 * r10 + l02 * r20 + l03 * r30, l00 * r01 + l01 * r11 + l02 * r21 + l03 * r31, l00 * r02 + l01 * r12 + l02 * r22 + l03 * r32, l00 * r03 + l01 * r13 + l02 * r23 + l03 * r33, l10 * r00 + l11 * r10 + l12 * r20 + l13 * r30, l10 * r01 + l11 * r11 + l12 * r21 + l13 * r31, l10 * r02 + l11 * r12 + l12 * r22 + l13 * r32, l10 * r03 + l11 * r13 + l12 * r23 + l13 * r33, l20 * r00 + l21 * r10 + l22 * r20 + l23 * r30, l20 * r01 + l21 * r11 + l22 * r21 + l23 * r31, l20 * r02 + l21 * r12 + l22 * r22 + l23 * r32, l20 * r03 + l21 * r13 + l22 * r23 + l23 * r33, l30 * r00 + l31 * r10 + l32 * r20 + l33 * r30, l30 * r01 + l31 * r11 + l32 * r21 + l33 * r31, l30 * r02 + l31 * r12 + l32 * r22 + l33 * r32, l30 * r03 + l31 * r13 + l32 * r23 + l33 * r33);
        };
        return Mat4;
    })(gml.Matrix);
    gml.Mat4 = Mat4;
    function makePerspective(fov, aspectRatio, near, far) {
        var t = near * Math.tan(fov.toRadians() / 2);
        var r = t * aspectRatio;
        var l = -r;
        var b = -t;
        var n = near;
        var f = far;
        return new Mat4((n * 2) / (r - l), 0, (r + l) / (r - l), 0, 0, (n * 2) / (t - b), (t + b) / (t - b), 0, 0, 0, -(f + n) / (f - n), -(f * n * 2) / (f - n), 0, 0, -1, 0);
    }
    gml.makePerspective = makePerspective;
    // aim, up, and right are all vectors that are assumed to be orthogonal
    function makeLookAt(pos, aim, up, right) {
        var x = right.normalized;
        var y = up.normalized;
        var z = aim.negate().normalized;
        var lookAt = Mat4.fromRows(x, y, z, new gml.Vec4(0, 0, 0, 1));
        var npos = pos.negate();
        lookAt.tx = npos.dot(x);
        lookAt.ty = npos.dot(y);
        lookAt.tz = npos.dot(z);
        return lookAt;
    }
    gml.makeLookAt = makeLookAt;
})(gml || (gml = {}));
///<reference path="../vec.ts"/>
var gml;
(function (gml) {
    var Vec2 = (function (_super) {
        __extends(Vec2, _super);
        function Vec2() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length == 2) {
                _super.call(this, 2, args[0], args[1]);
            }
            else if (args.length == 1) {
                _super.call(this, 2, args[0]);
            }
        }
        Object.defineProperty(Vec2.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec2.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Vec2.prototype.add = function (rhs) {
            return new Vec2(this.x + rhs.x, this.y + rhs.y);
        };
        Vec2.prototype.subtract = function (rhs) {
            return new Vec2(this.x - rhs.x, this.y - rhs.y);
        };
        Vec2.prototype.multiply = function (s) {
            return new Vec2(this.x * s, this.y * s);
        };
        Vec2.prototype.divide = function (d) {
            return new Vec2(this.x / d, this.y / d);
        };
        Vec2.prototype.negate = function () {
            return new Vec2(-this.x, -this.y);
        };
        Vec2.prototype.dot = function (rhs) {
            return this.x * rhs.x + this.y * rhs.y;
        };
        Object.defineProperty(Vec2.prototype, "normalized", {
            get: function () {
                var len = this.len;
                return new Vec2(this.x / len, this.y / len);
            },
            enumerable: true,
            configurable: true
        });
        Vec2.prototype.map = function (callback) {
            return new Vec2(this.v.map(callback));
        };
        Vec2.randomInCircle = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec2(Math.random(), Math.random()).normalized.multiply(radius);
        };
        Object.defineProperty(Vec2, "zero", {
            get: function () {
                return new Vec2(0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec2;
    })(gml.Vector);
    gml.Vec2 = Vec2;
})(gml || (gml = {}));
///<reference path="../vec.ts"/>
var gml;
(function (gml) {
    var Vec3 = (function (_super) {
        __extends(Vec3, _super);
        function Vec3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length == 3) {
                _super.call(this, 3, args[0], args[1], args[2]);
            }
            else if (args.length == 1) {
                _super.call(this, 3, args[0]);
            }
        }
        Object.defineProperty(Vec3.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "r", {
            get: function () {
                return this.v[0];
            },
            set: function (r) {
                this.v[0] = r;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "g", {
            get: function () {
                return this.v[1];
            },
            set: function (g) {
                this.v[1] = g;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "b", {
            get: function () {
                return this.v[2];
            },
            set: function (b) {
                this.v[2] = b;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec3.prototype, "xy", {
            get: function () {
                return new gml.Vec2(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Vec3.prototype.add = function (rhs) {
            return new Vec3(this.x + rhs.x, this.y + rhs.y, this.z + rhs.z);
        };
        Vec3.prototype.subtract = function (rhs) {
            return new Vec3(this.x - rhs.x, this.y - rhs.y, this.z - rhs.z);
        };
        Vec3.prototype.multiply = function (s) {
            return new Vec3(this.x * s, this.y * s, this.z * s);
        };
        Vec3.prototype.divide = function (d) {
            return new Vec3(this.x / d, this.y / d, this.z / d);
        };
        Vec3.prototype.negate = function () {
            return new Vec3(-this.x, -this.y, -this.z);
        };
        Vec3.prototype.dot = function (rhs) {
            return this.x * rhs.x + this.y * rhs.y + this.z * rhs.z;
        };
        Vec3.prototype.cross = function (rhs) {
            return new Vec3(this.y * rhs.z - this.z * rhs.y, this.z * rhs.x - this.x * rhs.z, this.x * rhs.y - this.y * rhs.x);
        };
        Object.defineProperty(Vec3.prototype, "normalized", {
            get: function () {
                var len = this.len;
                return new Vec3(this.x / len, this.y / len, this.z / len);
            },
            enumerable: true,
            configurable: true
        });
        Vec3.prototype.map = function (callback) {
            return new Vec3(this.v.map(callback));
        };
        Vec3.randomInSphere = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec3(Math.random(), Math.random(), Math.random()).normalized.multiply(radius);
        };
        Object.defineProperty(Vec3, "zero", {
            get: function () {
                return new Vec3(0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec3;
    })(gml.Vector);
    gml.Vec3 = Vec3;
})(gml || (gml = {}));
/// <reference path='../vec.ts'/>
var gml;
(function (gml) {
    var Vec4 = (function (_super) {
        __extends(Vec4, _super);
        function Vec4() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length == 4) {
                _super.call(this, 4, args[0], args[1], args[2], args[3]);
            }
            else if (args.length == 1) {
                _super.call(this, 4, args[0]);
            }
        }
        Object.defineProperty(Vec4.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            set: function (w) {
                this.v[3] = w;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "r", {
            get: function () {
                return this.v[0];
            },
            set: function (r) {
                this.v[0] = r;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "g", {
            get: function () {
                return this.v[1];
            },
            set: function (g) {
                this.v[1] = g;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "b", {
            get: function () {
                return this.v[2];
            },
            set: function (b) {
                this.v[2] = b;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "a", {
            get: function () {
                return this.v[3];
            },
            set: function (a) {
                this.v[3] = a;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "xyz", {
            get: function () {
                return new gml.Vec3(this.x, this.y, this.z);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4.prototype, "xy", {
            get: function () {
                return new gml.Vec2(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Vec4.prototype.add = function (rhs) {
            return new Vec4(this.x + rhs.x, this.y + rhs.y, this.z + rhs.z, this.w + rhs.w);
        };
        Vec4.prototype.subtract = function (rhs) {
            return new Vec4(this.x - rhs.x, this.y - rhs.y, this.z - rhs.z, this.w - rhs.w);
        };
        Vec4.prototype.multiply = function (s) {
            return new Vec4(this.x * s, this.y * s, this.z * s, this.w * s);
        };
        Vec4.prototype.divide = function (d) {
            return new Vec4(this.x / d, this.y / d, this.z / d, this.w / d);
        };
        Vec4.prototype.negate = function () {
            return new Vec4(-this.x, -this.y, -this.z, -this.w);
        };
        Vec4.prototype.dot = function (rhs) {
            return this.x * rhs.x + this.y * rhs.y + this.z * rhs.z + this.w * rhs.w;
        };
        /**
         * Computes the cross product as if this were a 3D vector (Vec3)
         *
         * @returns a Vec4 with its xyz components representing the 3D cross product
         *          between this and rhs. The w component of the resulting vector is
         *          always set to 0
         */
        Vec4.prototype.cross = function (rhs) {
            return new Vec4(this.y * rhs.z - this.z * rhs.y, this.z * rhs.x - this.x * rhs.z, this.x * rhs.y - this.y * rhs.x, 0);
        };
        Object.defineProperty(Vec4.prototype, "normalized", {
            get: function () {
                var len = this.len;
                return new Vec4(this.x / len, this.y / len, this.z / len, this.w / len);
            },
            enumerable: true,
            configurable: true
        });
        Vec4.prototype.map = function (callback) {
            return new Vec4(this.v.map(callback));
        };
        /**
         * @returns a random directional Vec4 in a user-specified sphere centered around (0, 0, 0).
         *          Note that the w-component of the Vec4 is 0.
         */
        Vec4.randomInSphere = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec4(Math.random(), Math.random(), Math.random(), 0).normalized.multiply(radius);
        };
        /**
         * @returns a random positional Vec4 in a user-specified sphere centered around (0, 0, 0).
         *          Note that the w-component of the Vec4 is 1.
         */
        Vec4.randomPositionInSphere = function (radius) {
            if (radius === void 0) { radius = 1; }
            var random = new Vec4(Math.random(), Math.random(), Math.random(), 0).normalized.multiply(radius);
            random.w = 1;
            return random;
        };
        Object.defineProperty(Vec4, "zero", {
            get: function () {
                return new Vec4(0, 0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4, "origin", {
            get: function () {
                return new Vec4(0, 0, 0, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4, "up", {
            get: function () {
                return new Vec4(0, 1, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vec4, "right", {
            get: function () {
                return new Vec4(1, 0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec4;
    })(gml.Vector);
    gml.Vec4 = Vec4;
})(gml || (gml = {}));
// simple angle interface with explicit constructors
/**
 * The gml library is mostly designed with 3D usage (WebGL) in mind.
 * It aspires to be performant, but is not yet up to par with incumbent
 * libraries (EG: gl-matrix)
 */
var gml;
(function (gml) {
    function fromRadians(rad) {
        return new Radian(rad);
    }
    gml.fromRadians = fromRadians;
    function fromDegrees(deg) {
        return new Degree(deg);
    }
    gml.fromDegrees = fromDegrees;
    // implementation detail; no need to care about these classes
    var Degree = (function () {
        function Degree(deg) {
            this.v = deg;
        }
        Degree.prototype.toDegrees = function () {
            return this.v;
        };
        Degree.prototype.toRadians = function () {
            return this.v * Math.PI / 180;
        };
        Degree.prototype.add = function (rhs) {
            return fromDegrees(this.v + rhs.toDegrees());
        };
        Degree.prototype.subtract = function (rhs) {
            return fromDegrees(this.v - rhs.toDegrees());
        };
        Degree.prototype.negate = function () {
            return fromDegrees(-this.v);
        };
        Degree.prototype.reduceToOneTurn = function () {
            if (this.v >= 360) {
                return fromDegrees(this.v - 360 * Math.floor(this.v / 360));
            }
            else if (this.v < 0) {
                return fromDegrees(this.v + 360 * Math.ceil(-this.v / 360));
            }
            else {
                return this;
            }
        };
        Object.defineProperty(Degree, "zero", {
            get: function () {
                return new Degree(0);
            },
            enumerable: true,
            configurable: true
        });
        return Degree;
    })();
    var Radian = (function () {
        function Radian(rad) {
            this.v = rad;
        }
        Object.defineProperty(Radian, "TWO_PI", {
            get: function () { return 6.283185307179586; },
            enumerable: true,
            configurable: true
        });
        Radian.prototype.toRadians = function () {
            return this.v;
        };
        Radian.prototype.toDegrees = function () {
            return this.v * 180 / Math.PI;
        };
        Radian.prototype.add = function (rhs) {
            return fromRadians(this.v + rhs.toRadians());
        };
        Radian.prototype.subtract = function (rhs) {
            return fromRadians(this.v - rhs.toRadians());
        };
        Radian.prototype.negate = function () {
            return fromRadians(-this.v);
        };
        Radian.prototype.reduceToOneTurn = function () {
            if (this.v >= Radian.TWO_PI) {
                return fromRadians(this.v - Radian.TWO_PI * Math.floor(this.v / Radian.TWO_PI));
            }
            else if (this.v < 0) {
                return fromRadians(this.v + Radian.TWO_PI * Math.ceil(-this.v / Radian.TWO_PI));
            }
            else {
                return this;
            }
        };
        Object.defineProperty(Radian, "zero", {
            get: function () {
                return new Radian(0);
            },
            enumerable: true,
            configurable: true
        });
        return Radian;
    })();
})(gml || (gml = {}));
var gml;
(function (gml) {
    /**
     * Implements common easing methods (generally used) for tweening/
     * animations.
     *
     * All methods assume a normalized input t (time) between 0 and 1
     * and returns an output t' between 0 and 1.
     */
    var Easing = (function () {
        function Easing() {
        }
        Easing.QuadIn = function (t) {
            return t * t;
        };
        Easing.QuadOut = function (t) {
            return -t * (t - 2);
        };
        Easing.QuadInOut = function (t) {
            if (t < 0.5) {
                /* we want verbatim behavior as QuadIn, except we're passing in t
                 * with a range of 0 to 0.5, and we want the output to also range from
                 * 0 to 0.5.
                 *
                 * we double the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuadIn function (t*t), then half the result to get an output
                 * from 0 to 0.5. Constant terms cancel to resolve to 2*t*t
                 */
                return 2 * t * t;
            }
            else {
                /* we want verbatim behavior as QuadOut, except we're passing in t
                 * with a range of 0.5 to 1, and we want the output to also range from
                 * 0.5 to 1.
                 *
                 * we transform the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuadOut function -t(t-2), then transform the result s.t. it is
                 * from 0.5 to 1.
                 */
                var _t = (t - 0.5) * 2;
                return (-_t * (_t - 2)) / 2 + 0.5;
            }
        };
        Easing.CubicIn = function (t) {
            return t * t * t;
        };
        Easing.CubicOut = function (t) {
            var _t = t - 1;
            return _t * _t * _t + 1;
        };
        Easing.CubicInOut = function (t) {
            if (t < 0.5) {
                /* we want verbatim behavior as CubicIn, except we're passing in t
                 * with a range of 0 to 0.5, and we want the output to also range from
                 * 0 to 0.5.
                 *
                 * we double the input parameter s.t. it is 0 to 1, then pass it into
                 * the CubicIn function (t*t*t), then half the result to get an output
                 * from 0 to 0.5. Constant terms cancel to resolve to 4*t*t*t
                 */
                return 4 * t * t * t;
            }
            else {
                /* we want verbatim behavior as CubicOut, except we're passing in t
                 * with a range of 0.5 to 1, and we want the output to also range from
                 * 0.5 to 1.
                 *
                 * we transform the input parameter s.t. it is 0 to 1, then pass it into
                 * the CubicOut function (t-1)^3 + 1, then transform the result s.t. it is
                 * from 0.5 to 1.
                 */
                var _t = ((t - 0.5) * 2) - 1;
                return (_t * _t * _t + 1) / 2 + 0.5;
            }
        };
        Easing.TrigIn = function (t) {
            return 1 - Math.cos(t * (Math.PI / 2));
        };
        Easing.TrigOut = function (t) {
            return Math.sin(t * (Math.PI / 2));
        };
        Easing.TrigInOut = function (t) {
            if (t < 0.5) {
                return 0.5 * (Math.sin(Math.PI * t));
            }
            else {
                return -0.5 * (Math.cos(Math.PI * (2 * t - 1) / 2) - 2);
            }
        };
        Easing.ExpIn = function (t, base) {
            if (base === void 0) { base = 10; }
            return t == 0 ? 0 : Math.pow(2, base * (t - 1));
        };
        Easing.ExpOut = function (t, base) {
            if (base === void 0) { base = 10; }
            return t == 1 ? 1 : 1 - Math.pow(2, -base * t);
        };
        Easing.ExpInOut = function (t, base) {
            if (base === void 0) { base = 10; }
            if (t == 0)
                return 0;
            else if (t == 1)
                return 1;
            else {
                if (t < 0.5) {
                    return 0.5 * Math.pow(2, base * (2 * t - 1));
                }
                else {
                    var _t = ((t - 0.5) * 2);
                    return (1 - Math.pow(2, -base * _t)) / 2 + 0.5;
                }
            }
        };
        Easing.BackIn = function (t, s) {
            if (s === void 0) { s = 1.70158; }
            return t * t * ((s + 1) * t - s);
        };
        Easing.BackOut = function (t, s) {
            if (s === void 0) { s = 1.70158; }
            var _t = t - 1;
            return _t * _t * ((s + 1) * _t + s) + 1;
        };
        Easing.BackInOut = function (t, s) {
            if (s === void 0) { s = 1.70158; }
            if (t < 0.5) {
                var _t = t * 2;
                return 0.5 * _t * _t * ((s + 1) * _t - s);
            }
            else {
                var _t = ((t - 0.5) * 2) - 1;
                return (_t * _t * ((s + 1) * _t + s) + 1) / 2 + 0.5;
            }
        };
        return Easing;
    })();
    gml.Easing = Easing;
})(gml || (gml = {}));
///<reference path = "angle.ts" />
///<reference path = "easing.ts" />
///<reference path = "vec.ts" />
///<reference path = "3d/vec2.ts" />
///<reference path = "3d/vec3.ts" />
///<reference path = "3d/vec4.ts" />
///<reference path = "mat.ts" />
///<reference path = "3d/mat3.ts" />
///<reference path = "3d/mat4.ts" />
if (typeof module !== 'undefined') {
    module.exports = gml;
}
var Material = (function () {
    function Material() {
        this.isTextureMapped = false;
    }
    return Material;
})();
///<reference path='material.ts' />
var BlinnPhongMaterial = (function (_super) {
    __extends(BlinnPhongMaterial, _super);
    function BlinnPhongMaterial(ambient, diffuse, specular, emissive, shininess) {
        if (ambient === void 0) { ambient = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (specular === void 0) { specular = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (emissive === void 0) { emissive = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (shininess === void 0) { shininess = 1.0; }
        _super.call(this);
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.emissive = emissive;
        this.shininess = shininess;
    }
    return BlinnPhongMaterial;
})(Material);
///<reference path='material.ts' />
var CookTorranceMaterial = (function (_super) {
    __extends(CookTorranceMaterial, _super);
    function CookTorranceMaterial(diffuse, specular, roughness, fresnel) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (specular === void 0) { specular = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (roughness === void 0) { roughness = 0.5; }
        if (fresnel === void 0) { fresnel = 1.586; }
        _super.call(this);
        this.diffuse = diffuse;
        this.specular = specular;
        this.roughness = roughness;
        this.fresnel = fresnel;
    }
    return CookTorranceMaterial;
})(Material);
///<reference path='material.ts' />
var DebugMaterial = (function (_super) {
    __extends(DebugMaterial, _super);
    function DebugMaterial() {
        _super.call(this);
    }
    return DebugMaterial;
})(Material);
///<reference path='material.ts' />
var LambertMaterial = (function (_super) {
    __extends(LambertMaterial, _super);
    function LambertMaterial(diffuse) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        _super.call(this);
        this.diffuse = diffuse;
    }
    return LambertMaterial;
})(Material);
///<reference path='material.ts' />
var OrenNayarMaterial = (function (_super) {
    __extends(OrenNayarMaterial, _super);
    function OrenNayarMaterial(diffuse, roughness) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (roughness === void 0) { roughness = 0.5; }
        _super.call(this);
        this.diffuse = diffuse;
        this.roughness = roughness;
    }
    return OrenNayarMaterial;
})(Material);
//
// prim.ts
// user editable primitive base interface
var RenderData = (function () {
    function RenderData() {
        this.dirty = true;
        this.vertices = new Float32Array([]);
        this.normals = new Float32Array([]);
        this.colors = new Float32Array([]);
        this.indices = new Uint16Array([]);
        this.isTextureMapped = false;
    }
    return RenderData;
})();
var Primitive = (function () {
    function Primitive() {
        this.transform = gml.Mat4.identity();
    }
    Primitive.prototype.translate = function (dist) {
        this.transform.translation = dist;
    };
    return Primitive;
})();
///<reference path='prim.ts' />
var Cone = (function (_super) {
    __extends(Cone, _super);
    function Cone(size) {
        if (size === void 0) { size = 1; }
        _super.call(this);
        this.transform.scale = new gml.Vec3(size, size, size);
        this.material = new BlinnPhongMaterial();
        this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        this.renderData.dirty = true;
    }
    // this should only be called by the renderer module
    Cone.prototype.rebuildRenderData = function () {
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
            // TODO share vertices between faces??
            var vertices = [
                // Front face
                -1.0, -1.0, 1.0,
                1.0, -1.0, 1.0,
                1.0, 1.0, 1.0,
                -1.0, 1.0, 1.0,
                // Back face
                -1.0, -1.0, -1.0,
                -1.0, 1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, -1.0, -1.0,
                // Top face
                -1.0, 1.0, -1.0,
                -1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, -1.0,
                // Bottom face
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0, 1.0,
                -1.0, -1.0, 1.0,
                // Right face
                1.0, -1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, 1.0, 1.0,
                1.0, -1.0, 1.0,
                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0, 1.0,
                -1.0, 1.0, 1.0,
                -1.0, 1.0, -1.0
            ];
            this.renderData.vertices = new Float32Array(vertices);
            if (!this.material.isTextureMapped) {
                var colors = [];
                for (var i = 0; i < 24; i++) {
                    colors = [];
                }
                this.renderData.colors = new Float32Array(colors);
            }
            var vertexNormals = [
                // Front
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                // Back
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                // Top
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                // Bottom
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                // Right
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                // Left
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0
            ];
            this.renderData.normals = new Float32Array(vertexNormals);
            var cubeVertexIndices = [
                0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23 // left
            ];
            this.renderData.indices = new Uint16Array(cubeVertexIndices);
        }
    };
    return Cone;
})(Primitive);
///<reference path='prim.ts' />
var Cube = (function (_super) {
    __extends(Cube, _super);
    function Cube(size, position, mat) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        _super.call(this);
        this.transform.scale = new gml.Vec3(size, size, size);
        this.material = mat;
        this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        this.renderData.dirty = true;
    }
    // this should only be called by the renderer module
    Cube.prototype.rebuildRenderData = function () {
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
            // TODO share vertices between faces??
            var vertices = [
                // Front face
                -1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, -1.0, 1.0,
                -1.0, -1.0, 1.0,
                // Back face
                -1.0, 1.0, -1.0,
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, 1.0, -1.0,
                // Top face
                -1.0, -1.0, -1.0,
                -1.0, -1.0, 1.0,
                1.0, -1.0, 1.0,
                1.0, -1.0, -1.0,
                // Bottom face
                -1.0, 1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, 1.0, 1.0,
                -1.0, 1.0, 1.0,
                // Right face
                1.0, 1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0, 1.0,
                1.0, 1.0, 1.0,
                // Left face
                -1.0, 1.0, -1.0,
                -1.0, 1.0, 1.0,
                -1.0, -1.0, 1.0,
                -1.0, -1.0, -1.0
            ];
            this.renderData.vertices = new Float32Array(vertices);
            if (!this.material.isTextureMapped) {
            }
            var vertexNormals = [
                // Front
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                // Back
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                // Top
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                // Bottom
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                // Right
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                // Left
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0
            ];
            this.renderData.normals = new Float32Array(vertexNormals);
            var cubeVertexIndices = [
                0, 2, 1, 0, 3, 2,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23 // left
            ];
            this.renderData.indices = new Uint16Array(cubeVertexIndices);
        }
    };
    return Cube;
})(Primitive);
///<reference path='prim.ts' />
var Quad = (function (_super) {
    __extends(Quad, _super);
    function Quad(size, position, mat) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        _super.call(this);
        this.transform.scale = new gml.Vec3(size, size, size);
        this.renderData = new RenderData();
        this.material = mat;
        // trigger a rebuild when the renderer updates
        this.renderData.dirty = true;
    }
    // this should only be called by the renderer module
    Quad.prototype.rebuildRenderData = function () {
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
            var vertices = [
                // Front face
                -1.0, 1.0, 0.0,
                1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0,
            ];
            this.renderData.vertices = new Float32Array(vertices);
            var vertexNormals = [
                // Front
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
            ];
            this.renderData.normals = new Float32Array(vertexNormals);
            var quadVertexIndices = [
                0, 1, 2, 0, 2, 3,
            ];
            this.renderData.indices = new Uint16Array(quadVertexIndices);
        }
    };
    return Quad;
})(Primitive);
///<reference path='prim.ts' />
//
// sphere.ts
// UV sphere (most basic sphere mesh)
var Sphere = (function (_super) {
    __extends(Sphere, _super);
    function Sphere(size, position, mat, parallels, meridians) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        if (parallels === void 0) { parallels = 15; }
        if (meridians === void 0) { meridians = 30; }
        _super.call(this);
        this.transform.scale = new gml.Vec3(size, size, size);
        this.transform.translation = position;
        this.material = mat;
        this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        this.renderData.dirty = true;
        this.parallels = parallels;
        this.meridians = meridians;
    }
    Sphere.prototype.rebuildRenderData = function () {
        var vertices = [];
        var indices = [];
        if (this.renderData.dirty) {
            for (var j = 0; j < this.parallels; j++) {
                var parallel = Math.PI * j / (this.parallels - 1);
                for (var i = 0; i < this.meridians; i++) {
                    var meridian = 2 * Math.PI * i / (this.meridians - 1);
                    var x = Math.sin(meridian) * Math.cos(parallel);
                    var y = Math.sin(meridian) * Math.sin(parallel);
                    var z = Math.cos(meridian);
                    vertices.push(x);
                    vertices.push(y);
                    vertices.push(z);
                }
            }
            for (var j = 0; j < this.parallels - 1; j++) {
                for (var i = 0; i < this.meridians; i++) {
                    var nextj = (j + 1); // loop invariant: j + 1 < this.parallels
                    var nexti = (i + 1) % this.meridians;
                    indices.push(j * this.meridians + i);
                    indices.push(j * this.meridians + nexti);
                    indices.push(nextj * this.meridians + nexti);
                    indices.push(j * this.meridians + i);
                    indices.push(nextj * this.meridians + nexti);
                    indices.push(nextj * this.meridians + i);
                }
            }
            this.renderData.vertices = new Float32Array(vertices);
            this.renderData.normals = new Float32Array(vertices); // for a sphere located at 0,0,0, the normals are exactly the same as the vertices
            this.renderData.indices = new Uint16Array(indices);
            this.renderData.dirty = false;
        }
    };
    return Sphere;
})(Primitive);
var SHADERTYPE;
(function (SHADERTYPE) {
    SHADERTYPE[SHADERTYPE["SIMPLE_VERTEX"] = 0] = "SIMPLE_VERTEX";
    SHADERTYPE[SHADERTYPE["LAMBERT_FRAGMENT"] = 1] = "LAMBERT_FRAGMENT";
    SHADERTYPE[SHADERTYPE["BLINN_PHONG_FRAGMENT"] = 2] = "BLINN_PHONG_FRAGMENT";
    SHADERTYPE[SHADERTYPE["UNLIT_FRAGMENT"] = 3] = "UNLIT_FRAGMENT";
    SHADERTYPE[SHADERTYPE["DEBUG_VERTEX"] = 4] = "DEBUG_VERTEX";
    SHADERTYPE[SHADERTYPE["DEBUG_FRAGMENT"] = 5] = "DEBUG_FRAGMENT";
    SHADERTYPE[SHADERTYPE["OREN_NAYAR_FRAGMENT"] = 6] = "OREN_NAYAR_FRAGMENT";
    SHADERTYPE[SHADERTYPE["COOK_TORRANCE_FRAGMENT"] = 7] = "COOK_TORRANCE_FRAGMENT";
    SHADERTYPE[SHADERTYPE["UTILS"] = 8] = "UTILS";
    SHADERTYPE[SHADERTYPE["SKYBOX_VERTEX"] = 9] = "SKYBOX_VERTEX";
    SHADERTYPE[SHADERTYPE["SKYBOX_FRAG"] = 10] = "SKYBOX_FRAG";
    SHADERTYPE[SHADERTYPE["CUBE_SH_VERT"] = 11] = "CUBE_SH_VERT";
    SHADERTYPE[SHADERTYPE["CUBE_SH_FRAG"] = 12] = "CUBE_SH_FRAG";
})(SHADERTYPE || (SHADERTYPE = {}));
;
var SHADER_PROGRAM;
(function (SHADER_PROGRAM) {
    SHADER_PROGRAM[SHADER_PROGRAM["DEBUG"] = 0] = "DEBUG";
    SHADER_PROGRAM[SHADER_PROGRAM["LAMBERT"] = 1] = "LAMBERT";
    SHADER_PROGRAM[SHADER_PROGRAM["OREN_NAYAR"] = 2] = "OREN_NAYAR";
    SHADER_PROGRAM[SHADER_PROGRAM["BLINN_PHONG"] = 3] = "BLINN_PHONG";
    SHADER_PROGRAM[SHADER_PROGRAM["COOK_TORRANCE"] = 4] = "COOK_TORRANCE";
    SHADER_PROGRAM[SHADER_PROGRAM["SKYBOX"] = 5] = "SKYBOX";
    SHADER_PROGRAM[SHADER_PROGRAM["SHADOWMAP"] = 6] = "SHADOWMAP";
    SHADER_PROGRAM[SHADER_PROGRAM["CUBE_SH"] = 7] = "CUBE_SH";
})(SHADER_PROGRAM || (SHADER_PROGRAM = {}));
;
var PASS;
(function (PASS) {
    PASS[PASS["SHADOW"] = 0] = "SHADOW";
    PASS[PASS["STANDARD_FORWARD"] = 1] = "STANDARD_FORWARD";
})(PASS || (PASS = {}));
;
var IRRADIANCE_PASS;
(function (IRRADIANCE_PASS) {
    IRRADIANCE_PASS[IRRADIANCE_PASS["SH_COMPUTE"] = 0] = "SH_COMPUTE";
    IRRADIANCE_PASS[IRRADIANCE_PASS["IRRADIANCE_COMPUTE"] = 1] = "IRRADIANCE_COMPUTE";
})(IRRADIANCE_PASS || (IRRADIANCE_PASS = {}));
;
var ShaderFile = (function () {
    function ShaderFile(source, loaded) {
        if (source === void 0) { source = ""; }
        if (loaded === void 0) { loaded = false; }
        this.source = source;
        this.loaded = loaded;
    }
    return ShaderFile;
})();
var ShaderRepository = (function () {
    function ShaderRepository(loadDoneCallback) {
        this.loadDoneCallback = loadDoneCallback;
        this.files = [];
        for (var t in SHADERTYPE) {
            if (!isNaN(t)) {
                this.files[t] = new ShaderFile();
            }
        }
        this.loadShaders();
    }
    ShaderRepository.prototype.loadShaders = function () {
        var _this = this;
        this.asyncLoadShader("basic.vert", SHADERTYPE.SIMPLE_VERTEX, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("debug.vert", SHADERTYPE.DEBUG_VERTEX, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("unlit.frag", SHADERTYPE.UNLIT_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("lambert.frag", SHADERTYPE.LAMBERT_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("blinn-phong.frag", SHADERTYPE.BLINN_PHONG_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("debug.frag", SHADERTYPE.DEBUG_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("oren-nayar.frag", SHADERTYPE.OREN_NAYAR_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cook-torrance.frag", SHADERTYPE.COOK_TORRANCE_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("utils.frag", SHADERTYPE.UTILS, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("skybox.vert", SHADERTYPE.SKYBOX_VERTEX, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("skybox.frag", SHADERTYPE.SKYBOX_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cube-sh.vert", SHADERTYPE.CUBE_SH_VERT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cube-sh.frag", SHADERTYPE.CUBE_SH_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
    };
    ShaderRepository.prototype.asyncLoadShader = function (name, stype, loaded) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", function (evt) { loaded(stype, req.responseText); });
        req.open("GET", "./shaders/" + name, true);
        req.send();
    };
    ShaderRepository.prototype.shaderLoaded = function (stype, contents) {
        this.files[stype].source = contents;
        this.files[stype].loaded = true;
        if (this.requiredShadersLoaded()) {
            if (this.loadDoneCallback != null) {
                this.loadDoneCallback(this);
            }
            this.loadDoneCallback = null;
        }
    };
    ShaderRepository.prototype.requiredShadersLoaded = function () {
        var loaded = true;
        for (var t in SHADERTYPE) {
            if (parseInt(t, 10) >= 0) {
                loaded = loaded && this.files[t].loaded;
            }
        }
        return loaded;
    };
    ShaderRepository.prototype.allShadersLoaded = function () {
        var allLoaded = true;
        for (var v in SHADERTYPE) {
            if (!isNaN(v)) {
                allLoaded = allLoaded && this.files[v].loaded;
            }
        }
        return allLoaded;
    };
    return ShaderRepository;
})();
var ShaderSource = (function () {
    function ShaderSource(vs, fs) {
        this.vs = vs;
        this.fs = fs;
    }
    return ShaderSource;
})();
var ShaderMaterialProperties = (function () {
    function ShaderMaterialProperties() {
    }
    return ShaderMaterialProperties;
})();
var ShaderLightProperties = (function () {
    function ShaderLightProperties() {
    }
    return ShaderLightProperties;
})();
var ShaderUniforms = (function () {
    function ShaderUniforms() {
    }
    return ShaderUniforms;
})();
var ShaderProgramData = (function () {
    function ShaderProgramData() {
        this.program = null;
        this.uniforms = new ShaderUniforms();
    }
    return ShaderProgramData;
})();
var Renderer = (function () {
    function Renderer(viewportElement, sr, backgroundColor) {
        if (backgroundColor === void 0) { backgroundColor = new gml.Vec4(0, 0, 0, 1); }
        var gl = (viewportElement.getContext("experimental-webgl"));
        gl.viewport(0, 0, viewportElement.width, viewportElement.height);
        this.viewportW = viewportElement.width;
        this.viewportH = viewportElement.height;
        gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things
        this.context = gl;
        var success = true;
        if (!this.context) {
            alert("Unable to initialize WebGL. Your browser may not support it");
            success = false;
        }
        this.shaderLODExtension = gl.getExtension("EXT_shader_texture_lod");
        this.programData = [];
        // compile phong program
        var phongProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.BLINN_PHONG_FRAGMENT].source);
        if (phongProgram == null) {
            alert("Phong shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.BLINN_PHONG] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.BLINN_PHONG].program = phongProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.BLINN_PHONG);
        var lambertProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.LAMBERT_FRAGMENT].source);
        if (lambertProgram == null) {
            alert("Lambert shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.LAMBERT] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.LAMBERT].program = lambertProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.LAMBERT);
        var debugProgram = this.compileShaderProgram(sr.files[SHADERTYPE.DEBUG_VERTEX].source, sr.files[SHADERTYPE.DEBUG_FRAGMENT].source);
        if (debugProgram == null) {
            alert("Debug shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.DEBUG] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.DEBUG].program = debugProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.DEBUG);
        var orenNayarProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.OREN_NAYAR_FRAGMENT].source);
        if (orenNayarProgram == null) {
            alert("Oren-Nayar shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.OREN_NAYAR] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.OREN_NAYAR].program = orenNayarProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.OREN_NAYAR);
        var cookTorranceProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.COOK_TORRANCE_FRAGMENT].source);
        if (cookTorranceProgram == null) {
            alert("Cook-Torrance shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.COOK_TORRANCE] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.COOK_TORRANCE].program = cookTorranceProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.COOK_TORRANCE);
        var skyboxProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SKYBOX_VERTEX].source, sr.files[SHADERTYPE.SKYBOX_FRAG].source);
        if (skyboxProgram == null) {
            alert("Skybox shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.SKYBOX] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.SKYBOX].program = skyboxProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.SKYBOX);
        var cubeMapSHProgram = this.compileShaderProgram(sr.files[SHADERTYPE.CUBE_SH_VERT].source, sr.files[SHADERTYPE.CUBE_SH_FRAG].source);
        if (cubeMapSHProgram == null) {
            alert("Cube map shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.CUBE_SH] = new ShaderProgramData();
        this.programData[SHADER_PROGRAM.CUBE_SH].program = cubeMapSHProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.CUBE_SH);
        // initialize shadowmap textures
        {
            this.depthTextureExtension = gl.getExtension("WEBGL_depth_texture");
            var size = 64;
            var shadowColorTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, shadowColorTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.shadowDepthTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
            this.shadowFramebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowColorTexture, 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowDepthTexture, 0);
            this.shadowmapSize = size;
        }
        {
            this.envMapSHTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.envMapSHTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            var sb = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, sb);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 8, 1);
            this.envMapSHFrameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.envMapSHFrameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.envMapSHTexture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sb);
        }
        this.vertexBuffer = gl.createBuffer();
        this.vertexNormalBuffer = gl.createBuffer();
        this.vertexColorBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        this.dirty = true;
    }
    Renderer.prototype.cacheLitShaderProgramLocations = function (sp) {
        var gl = this.context;
        var program = this.programData[sp].program;
        var uniforms = this.programData[sp].uniforms;
        uniforms.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.enableVertexAttribArray(uniforms.aVertexPosition);
        uniforms.aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
        if (uniforms.aVertexNormal >= 0) {
            gl.enableVertexAttribArray(uniforms.aVertexNormal);
        }
        uniforms.uModelView = gl.getUniformLocation(program, "uMVMatrix");
        uniforms.uModelToWorld = gl.getUniformLocation(program, "uMMatrix");
        uniforms.uPerspective = gl.getUniformLocation(program, "uPMatrix");
        uniforms.uNormalModelView = gl.getUniformLocation(program, "uNormalMVMatrix");
        uniforms.uNormalWorld = gl.getUniformLocation(program, "uNormalWorldMatrix");
        uniforms.uInverseProjection = gl.getUniformLocation(program, "uInverseProjectionMatrix");
        uniforms.uInverseView = gl.getUniformLocation(program, "uInverseViewMatrix");
        uniforms.uCameraPos = gl.getUniformLocation(program, "cPosition_World");
        uniforms.uEnvMap = gl.getUniformLocation(program, "environment");
        uniforms.uIrradianceMap = gl.getUniformLocation(program, "irradiance");
        uniforms.uEnvironmentMipMaps = gl.getUniformLocation(program, "environmentMipMaps");
        uniforms.uMaterial = new ShaderMaterialProperties();
        uniforms.uMaterial.ambient = gl.getUniformLocation(program, "mat.ambient");
        uniforms.uMaterial.diffuse = gl.getUniformLocation(program, "mat.diffuse");
        uniforms.uMaterial.specular = gl.getUniformLocation(program, "mat.specular");
        uniforms.uMaterial.emissive = gl.getUniformLocation(program, "mat.emissive");
        uniforms.uMaterial.shininess = gl.getUniformLocation(program, "mat.shininess");
        uniforms.uMaterial.roughness = gl.getUniformLocation(program, "mat.roughness");
        uniforms.uMaterial.fresnel = gl.getUniformLocation(program, "mat.fresnel");
        uniforms.uLights = [];
        for (var i = 0; i < 10; i++) {
            uniforms.uLights[i] = new ShaderLightProperties();
            uniforms.uLights[i].position = gl.getUniformLocation(program, "lights[" + i + "].position");
            uniforms.uLights[i].color = gl.getUniformLocation(program, "lights[" + i + "].color");
            uniforms.uLights[i].enabled = gl.getUniformLocation(program, "lights[" + i + "].enabled");
            uniforms.uLights[i].radius = gl.getUniformLocation(program, "lights[" + i + "].radius");
        }
    };
    Renderer.prototype.compileShaderProgram = function (vs, fs) {
        var gl = this.context;
        if (gl) {
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vs);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.log("An error occurred compiling the vertex shader: " + gl.getShaderInfoLog(vertexShader));
                return null;
            }
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fs);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                console.log("An error occurred compiling the fragment shader: " + gl.getShaderInfoLog(fragmentShader));
                return null;
            }
            // Create the shader program
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            // force aVertexPosition to be bound to 0 to avoid perf penalty
            // gl.bindAttribLocation( program, 0, "aVertexPosition" );
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log("Unable to initialize the shader program." + gl.getProgramInfoLog(program));
            }
            return program;
        }
        return null;
    };
    Renderer.prototype.update = function () {
        var _this = this;
        var scene = Scene.getActiveScene();
        if (scene) {
            scene.renderables.forEach(function (p) {
                if (p.renderData.dirty) {
                    p.rebuildRenderData();
                    _this.dirty = true;
                }
            });
        }
    };
    Renderer.prototype.renderSceneEnvironment = function (gl, scene, mvStack) {
        // TODO unhardcode me
        var perspective = gml.makePerspective(gml.fromDegrees(45), 640.0 / 480.0, 0.1, 100.0);
        gl.useProgram(this.programData[SHADER_PROGRAM.SKYBOX].program);
        this.currentProgram = SHADER_PROGRAM.SKYBOX;
        var locations = this.programData[SHADER_PROGRAM.SKYBOX].uniforms;
        var fullscreen = new Quad();
        fullscreen.rebuildRenderData();
        var inverseProjectionMatrix = perspective.invert();
        gl.uniformMatrix4fv(locations.uInverseProjection, false, inverseProjectionMatrix.m);
        var inverseViewMatrix = mvStack[mvStack.length - 1].invert().mat3;
        gl.uniformMatrix3fv(locations.uInverseView, false, inverseViewMatrix.m);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fullscreen.renderData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fullscreen.renderData.indices, gl.STATIC_DRAW);
        gl.uniform1i(locations.uEnvMap, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environment.cubeMapTexture);
        gl.drawElements(gl.TRIANGLES, fullscreen.renderData.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    Renderer.prototype.renderScene = function (gl, scene, mvStack, pass) {
        var _this = this;
        var perspective = gml.makePerspective(gml.fromDegrees(45), 640.0 / 480.0, 0.1, 100.0);
        scene.renderables.forEach(function (p, i) {
            if (p.material instanceof BlinnPhongMaterial) {
                gl.useProgram(_this.programData[SHADER_PROGRAM.BLINN_PHONG].program);
                _this.currentProgram = SHADER_PROGRAM.BLINN_PHONG;
                var blinnphong = p.material;
                var locations_1 = _this.programData[SHADER_PROGRAM.BLINN_PHONG].uniforms;
                gl.uniform4fv(locations_1.uMaterial.diffuse, blinnphong.diffuse.v);
                gl.uniform4fv(locations_1.uMaterial.ambient, blinnphong.ambient.v);
                gl.uniform4fv(locations_1.uMaterial.specular, blinnphong.specular.v);
                gl.uniform4fv(locations_1.uMaterial.emissive, blinnphong.emissive.v);
                gl.uniform1f(locations_1.uMaterial.shininess, blinnphong.shininess);
            }
            else if (p.material instanceof DebugMaterial) {
                gl.useProgram(_this.programData[SHADER_PROGRAM.DEBUG].program);
                _this.currentProgram = SHADER_PROGRAM.DEBUG;
            }
            else if (p.material instanceof OrenNayarMaterial) {
                gl.useProgram(_this.programData[SHADER_PROGRAM.OREN_NAYAR].program);
                _this.currentProgram = SHADER_PROGRAM.OREN_NAYAR;
                var orennayar = p.material;
                var locations_2 = _this.programData[SHADER_PROGRAM.OREN_NAYAR].uniforms;
                gl.uniform4fv(locations_2.uMaterial.diffuse, orennayar.diffuse.v);
                gl.uniform1f(locations_2.uMaterial.roughness, orennayar.roughness);
            }
            else if (p.material instanceof LambertMaterial) {
                gl.useProgram(_this.programData[SHADER_PROGRAM.LAMBERT].program);
                _this.currentProgram = SHADER_PROGRAM.LAMBERT;
                var lambert = p.material;
                var locations_3 = _this.programData[SHADER_PROGRAM.LAMBERT].uniforms;
                gl.uniform4fv(locations_3.uMaterial.diffuse, lambert.diffuse.v);
            }
            else if (p.material instanceof CookTorranceMaterial) {
                gl.useProgram(_this.programData[SHADER_PROGRAM.COOK_TORRANCE].program);
                _this.currentProgram = SHADER_PROGRAM.COOK_TORRANCE;
                var cooktorrance = p.material;
                var locations_4 = _this.programData[SHADER_PROGRAM.COOK_TORRANCE].uniforms;
                gl.uniform4fv(locations_4.uMaterial.diffuse, cooktorrance.diffuse.v);
                gl.uniform4fv(locations_4.uMaterial.specular, cooktorrance.specular.v);
                gl.uniform1f(locations_4.uMaterial.roughness, cooktorrance.roughness);
                gl.uniform1f(locations_4.uMaterial.fresnel, cooktorrance.fresnel);
            }
            var locations = _this.programData[_this.currentProgram].uniforms;
            scene.lights.forEach(function (l, i) {
                var lightpos = mvStack[mvStack.length - 1].transform(l.position);
                gl.uniform4fv(locations.uLights[i].position, lightpos.v);
                gl.uniform4fv(locations.uLights[i].color, l.color.v);
                gl.uniform1i(locations.uLights[i].enabled, l.enabled ? 1 : 0);
                gl.uniform1f(locations.uLights[i].radius, l.radius);
            });
            gl.uniformMatrix4fv(locations.uPerspective, false, perspective.m);
            if (_this.camera != null) {
                gl.uniform4fv(locations.uCameraPos, _this.camera.matrix.translation.v);
            }
            var primitiveModelView = mvStack[mvStack.length - 1].multiply(p.transform);
            gl.uniformMatrix4fv(locations.uModelView, false, primitiveModelView.m);
            gl.uniformMatrix4fv(locations.uModelToWorld, false, p.transform.m);
            // the normal matrix is defined as the upper 3x3 block of transpose( inverse( model-view ) )
            var normalMVMatrix = primitiveModelView.invert().transpose().mat3;
            gl.uniformMatrix3fv(locations.uNormalModelView, false, normalMVMatrix.m);
            var normalWorldMatrix = p.transform.invert().transpose().mat3;
            gl.uniformMatrix3fv(locations.uNormalWorld, false, normalWorldMatrix.m);
            var inverseViewMatrix = mvStack[mvStack.length - 1].invert().mat3;
            gl.uniformMatrix3fv(locations.uInverseView, false, inverseViewMatrix.m);
            gl.bindBuffer(gl.ARRAY_BUFFER, _this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, p.renderData.vertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, p.renderData.indices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, _this.vertexNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, p.renderData.normals, gl.STATIC_DRAW);
            gl.vertexAttribPointer(locations.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
            gl.uniform1i(locations.uEnvMap, 0);
            gl.uniform1f(locations.uEnvironmentMipMaps, 7);
            gl.uniform1i(locations.uIrradianceMap, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environment.cubeMapTexture);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.irradiance.cubeMapTexture);
            gl.drawElements(gl.TRIANGLES, p.renderData.indices.length, gl.UNSIGNED_SHORT, 0);
        });
    };
    Renderer.prototype.bindCubeMapFace = function (gl, face, image) {
        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    Renderer.prototype.renderIrradianceFromScene = function (gl, scene, pass) {
        gl.useProgram(this.programData[SHADER_PROGRAM.CUBE_SH].program);
        this.currentProgram = SHADER_PROGRAM.CUBE_SH;
        var fullscreen = new Quad();
        fullscreen.rebuildRenderData();
        var locations = this.programData[this.currentProgram].uniforms;
        gl.uniformMatrix4fv(locations.uModelView, false, gml.Mat4.identity().m);
        gl.uniformMatrix3fv(locations.uNormalModelView, false, gml.Mat3.identity().m);
        gl.uniformMatrix4fv(locations.uPerspective, false, gml.Mat4.identity().m);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fullscreen.renderData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fullscreen.renderData.indices, gl.STATIC_DRAW);
        gl.uniform1i(locations.uEnvMap, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environment.cubeMapTexture);
        gl.drawElements(gl.TRIANGLES, fullscreen.renderData.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    Renderer.prototype.renderIrradiance = function () {
        var gl = this.context;
        if (gl) {
            var scene = Scene.getActiveScene();
            if (scene) {
                // SET UP ENVIRONMENT MAP
                var cubeMapTexture = null;
                if (scene.environment != null && scene.environment.loaded && scene.environment.cubeMapTexture == null) {
                    var cubeMapTexture_1 = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture_1);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, scene.environment.faces[CUBEMAPTYPE.POS_X]);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, scene.environment.faces[CUBEMAPTYPE.NEG_X]);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, scene.environment.faces[CUBEMAPTYPE.POS_Y]);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, scene.environment.faces[CUBEMAPTYPE.NEG_Y]);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, scene.environment.faces[CUBEMAPTYPE.POS_Z]);
                    this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, scene.environment.faces[CUBEMAPTYPE.NEG_Z]);
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    scene.environment.cubeMapTexture = cubeMapTexture_1;
                }
                //
                // COMPUTE SH COEFFICIENTS
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, 8, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
                this.renderIrradianceFromScene(gl, scene, IRRADIANCE_PASS.SH_COMPUTE);
            }
        }
    };
    Renderer.prototype.render = function () {
        var gl = this.context;
        if (gl) {
            if (this.dirty) {
                //
                // DRAW
                var scene = Scene.getActiveScene();
                if (scene) {
                    //
                    // SET UP ENVIRONMENT MAP
                    var cubeMapTexture = null;
                    if (scene.environment != null && scene.environment.loaded && scene.environment.cubeMapTexture == null) {
                        var cubeMapTexture_2 = gl.createTexture();
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture_2);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, scene.environment.faces[CUBEMAPTYPE.POS_X]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, scene.environment.faces[CUBEMAPTYPE.NEG_X]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, scene.environment.faces[CUBEMAPTYPE.POS_Y]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, scene.environment.faces[CUBEMAPTYPE.NEG_Y]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, scene.environment.faces[CUBEMAPTYPE.POS_Z]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, scene.environment.faces[CUBEMAPTYPE.NEG_Z]);
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                        scene.environment.cubeMapTexture = cubeMapTexture_2;
                    }
                    //
                    // SET UP IRRADIANCE MAP
                    var irradianceTexture = null;
                    if (scene.irradiance != null && scene.irradiance.loaded && scene.irradiance.cubeMapTexture == null) {
                        var cubeMapTexture_3 = gl.createTexture();
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture_3);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, scene.irradiance.faces[CUBEMAPTYPE.POS_X]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, scene.irradiance.faces[CUBEMAPTYPE.NEG_X]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, scene.irradiance.faces[CUBEMAPTYPE.POS_Y]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, scene.irradiance.faces[CUBEMAPTYPE.NEG_Y]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, scene.irradiance.faces[CUBEMAPTYPE.POS_Z]);
                        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, scene.irradiance.faces[CUBEMAPTYPE.NEG_Z]);
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                        scene.irradiance.cubeMapTexture = cubeMapTexture_3;
                    }
                    var mvStack = [];
                    if (this.camera != null) {
                        mvStack.push(this.camera.matrix);
                    }
                    else {
                        mvStack.push(gml.Mat4.identity());
                    }
                    // for each renderable, set up shader and shader parameters
                    // lights, and buffers. For now, only render a single shadow map.
                    //
                    // RENDER TO SHADOW TEXTURE
                    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);
                    gl.viewport(0, 0, this.shadowmapSize, this.shadowmapSize);
                    gl.colorMask(false, false, false, false); // shadow map; no need to touch colors
                    gl.clear(gl.DEPTH_BUFFER_BIT);
                    this.renderScene(gl, scene, mvStack, PASS.SHADOW);
                    // 
                    // RENDER TO SCREEN
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.viewport(0, 0, this.viewportW, this.viewportH);
                    gl.colorMask(true, true, true, true);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    // draw environment map
                    this.renderSceneEnvironment(gl, scene, mvStack);
                    // draw scene
                    gl.clear(gl.DEPTH_BUFFER_BIT);
                    this.renderScene(gl, scene, mvStack, PASS.STANDARD_FORWARD);
                }
                this.dirty = false;
            }
        }
    };
    Renderer.prototype.setCamera = function (camera) {
        this.camera = camera;
        this.dirty = true;
    };
    return Renderer;
})();
;
;
//
// light.ts
// user editable light base interface
var Light = (function () {
    function Light() {
        this.position = new gml.Vec4(0, 0, 0, 1);
        this.enabled = true;
        this.color = new gml.Vec4(1, 1, 1, 1);
        this.radius = 1;
    }
    return Light;
})();
var PointLight = (function (_super) {
    __extends(PointLight, _super);
    function PointLight(position, color, radius) {
        if (radius === void 0) { radius = 1; }
        _super.call(this);
        this.position = position;
        this.color = color;
        this.radius = radius;
    }
    return PointLight;
})(Light);
var CUBEMAPTYPE;
(function (CUBEMAPTYPE) {
    CUBEMAPTYPE[CUBEMAPTYPE["POS_X"] = 0] = "POS_X";
    CUBEMAPTYPE[CUBEMAPTYPE["NEG_X"] = 1] = "NEG_X";
    CUBEMAPTYPE[CUBEMAPTYPE["POS_Y"] = 2] = "POS_Y";
    CUBEMAPTYPE[CUBEMAPTYPE["NEG_Y"] = 3] = "NEG_Y";
    CUBEMAPTYPE[CUBEMAPTYPE["POS_Z"] = 4] = "POS_Z";
    CUBEMAPTYPE[CUBEMAPTYPE["NEG_Z"] = 5] = "NEG_Z";
})(CUBEMAPTYPE || (CUBEMAPTYPE = {}));
;
var CubeMap = (function () {
    function CubeMap(px, nx, py, ny, pz, nz, finishedLoading) {
        if (finishedLoading === void 0) { finishedLoading = null; }
        this.faces = [];
        this.facesLoaded = 0;
        this.cubeMapTexture = null;
        for (var t in CUBEMAPTYPE) {
            if (!isNaN(t)) {
                this.faces[t] = new Image();
            }
        }
        this.asyncLoadFace(px, CUBEMAPTYPE.POS_X, finishedLoading);
        this.asyncLoadFace(nx, CUBEMAPTYPE.NEG_X, finishedLoading);
        this.asyncLoadFace(py, CUBEMAPTYPE.POS_Y, finishedLoading);
        this.asyncLoadFace(ny, CUBEMAPTYPE.NEG_Y, finishedLoading);
        this.asyncLoadFace(pz, CUBEMAPTYPE.POS_Z, finishedLoading);
        this.asyncLoadFace(nz, CUBEMAPTYPE.NEG_Z, finishedLoading);
    }
    CubeMap.prototype.asyncLoadFace = function (url, ctype, finishedLoading) {
        var _this = this;
        this.faces[ctype].src = url;
        this.faces[ctype].onload = function () { _this.faceLoaded(ctype, finishedLoading); };
    };
    CubeMap.prototype.faceLoaded = function (ctype, finishedLoading) {
        this.facesLoaded++;
        if (this.loaded) {
            finishedLoading();
        }
    };
    Object.defineProperty(CubeMap.prototype, "loaded", {
        // returns true when all six faces of the cube map has been loaded
        get: function () {
            return this.facesLoaded == 6;
        },
        enumerable: true,
        configurable: true
    });
    return CubeMap;
})();
var Scene = (function () {
    function Scene(environment, irradiance) {
        this.renderables = [];
        this.lights = [];
        this.environment = environment;
        this.irradiance = irradiance;
    }
    Scene.prototype.addRenderable = function (renderable) {
        this.renderables.push(renderable);
    };
    Scene.prototype.addLight = function (light) {
        this.lights.push(light);
    };
    Scene.setActiveScene = function (scene) {
        this.activeScene = scene;
    };
    Scene.getActiveScene = function () {
        return this.activeScene;
    };
    return Scene;
})();
