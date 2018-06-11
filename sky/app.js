var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Camera = /** @class */ (function () {
    function Camera(position, aim, up, right) {
        this.matrix = gml.makeLookAt(position, aim, up, right);
        this.focalDistance = 0.025;
    }
    Object.defineProperty(Camera.prototype, "pos", {
        get: function () {
            return this.matrix.column(3).negate();
        },
        set: function (val) {
            this.matrix.setColumn(3, val.negate().normalized);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "aim", {
        get: function () {
            return this.matrix.column(2);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "up", {
        get: function () {
            return this.matrix.column(1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "right", {
        get: function () {
            return this.matrix.column(0);
        },
        enumerable: true,
        configurable: true
    });
    return Camera;
}());
var gml;
(function (gml) {
    var Halfspace;
    (function (Halfspace) {
        Halfspace[Halfspace["POSITIVE"] = 0] = "POSITIVE";
        Halfspace[Halfspace["NEGATIVE"] = 1] = "NEGATIVE";
        Halfspace[Halfspace["COINCIDENT"] = 2] = "COINCIDENT";
    })(Halfspace = gml.Halfspace || (gml.Halfspace = {}));
    var Collision = /** @class */ (function () {
        function Collision() {
        }
        /**
         * Given a point, classifies on which side of a plane it lies.
         */
        Collision.CategorizeHalfspace = function (point, plane) {
            // we know that for the plane, N dot p0 + d = 0 where p0 is a point on the plane
            // we know that the point p is on the positive side of the halfspace iff:
            //      N dot (p - p0) > 0
            //   => N dot p - N dot p0 > 0
            //   => N dot p - (-d) > 0 (substituting N dot p0 = -d)
            //   => N dot p > -d
            var dp = plane.normal.dot(point);
            if (Math.abs(dp + plane.d) < gml.EPSILON) {
                return Halfspace.COINCIDENT;
            }
            else if (dp > -plane.d) {
                return Halfspace.POSITIVE;
            }
            else {
                return Halfspace.NEGATIVE;
            }
        };
        /**
         * Computes the point of intersection between a line segment and a plane if one exists.
         *
         * @returns true if there exists a single point intersection between the line segment and a plane
         *          false if there exists no intersections or if the line segment lies on the plane
         */
        Collision.LineSegmentPlaneIntersection = function (seg_start, seg_end, pl, result) {
            // let p1, p2 be seg_start, seg_end respectively.
            // let p, n be some point on and the normal of the plane pl respectively, let d be the parameter d of the plane pl.
            // let p' be the intersection point of the line defined by the line segment and the plane.
            //
            // we have   p'                         = p1 + t*(p2-p1)
            // and       p dot n + d                = 0
            // =>        (p1 + t*(p2-p1)) dot n + d = 0
            //
            // after some arithmetic, we arrive at:
            //
            // t = -(n dot p1 + d)/(n dot (p2-p1))
            //
            // if n dot (p2-p1) = 0, then the line is parallel with the plane (it lies on the plane if n dot p1 + d is also 0).
            var r = seg_end.subtract(seg_start);
            var denom = pl.normal.dot(r);
            if (denom != 0) {
                var t = -(pl.normal.dot(seg_start) + pl.d) / denom;
                if (t > 0 && t <= 1) {
                    gml.Vec4.multiply(r, t, result);
                    gml.Vec4.add(seg_start, result, result);
                    return true;
                }
            }
            return false;
        };
        /**
         * Computes the point of intersection between a ray and a plane if one exists.
         *
         * @returns true if there exists a single point intersection between the ray and a plane
         *          false if there exists no intersections or if the ray lies on the plane
         */
        Collision.RayPlaneIntersection = function (ray, pl, result) {
            // let o, v be the start and direction of ray.
            // let p, n be some point on and the normal of the plane pl respectively, let d be the parameter d of the plane pl.
            // let p' be the intersection point of the ray and the plane.
            //
            // we have   p'                  = o + t*v
            // and       p dot n + d         = 0
            // =>        (o + t*v) dot n + d = 0
            //
            // after some arithmetic, we arrive at:
            //
            // t = -(n dot o + d)/(n dot v)
            //
            // if n dot v = 0, then the ray is parallel with the plane (it lies on the plane if n dot o + d is also 0).
            var denom = pl.normal.dot(ray.direction);
            if (denom != 0) {
                var t = -(pl.normal.dot(ray.point) + pl.d) / denom;
                if (t > 0) {
                    gml.Vec4.multiply(ray.direction, t, result);
                    gml.Vec4.add(ray.point, result, result);
                    return true;
                }
            }
            return false;
        };
        /**
         * Clips a polygon with a set of planes using the Sutherland-Hodgman algorithm.
         *
         * @returns A polygon that is the result of the subject polygon clipped
         * by the clipper plane set
         */
        Collision.Clip = function (subject, clipper) {
            var out_pts = [];
            // assume the positive halfspace means inside
            var inside = Halfspace.POSITIVE;
            for (var i = 0; i < clipper.length; i++) {
                var plane = clipper[i];
                // iterate over points in polygon, checking two  points each time and categorizing them.
                var s = subject.points[subject.points.length - 1];
                var intersection = gml.Vec4.zero;
                for (var j = 0; j < subject.points.length; j++) {
                    var e = subject.points[j];
                    var e_cat = Collision.CategorizeHalfspace(e, plane);
                    var s_cat = Collision.CategorizeHalfspace(s, plane);
                    if (e_cat == inside) {
                        if (s_cat != inside) {
                            if (Collision.LineSegmentPlaneIntersection(s, e, plane, intersection)) {
                                out_pts.push(gml.Vec4.clone(intersection));
                            }
                        }
                        out_pts.push(gml.Vec4.clone(e));
                    }
                    else if (s_cat == inside) {
                        if (Collision.LineSegmentPlaneIntersection(s, e, plane, intersection)) {
                            out_pts.push(gml.Vec4.clone(intersection));
                        }
                    }
                    s = e; // advance vertex pointer ( look at the next edge in subject polygon)
                }
            }
            return new gml.Polygon(out_pts);
        };
        return Collision;
    }());
    gml.Collision = Collision;
})(gml || (gml = {}));
var gml;
(function (gml) {
    var Vector = /** @class */ (function () {
        function Vector(size) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.size = size;
            this.v = new Float32Array(size);
            if (args.length === 0) {
                return;
            }
            else if (args.length === 1) {
                var arr = args[0];
                if (arr instanceof Float32Array) {
                    this.v.set(arr);
                }
                else if (arr instanceof Array) {
                    for (var i = 0; i < size; i++) {
                        this.v[i] = arr[i];
                    }
                }
            }
            else {
                for (var i = 0; i < size; i++) {
                    this.v[i] = args[i];
                }
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
            for (var i = 0; i < this.size; i++) {
                this.v[i] /= l;
            }
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
            return new Vector(this.size, Array.prototype.slice.call(this.v).map(callback));
        };
        Vector.prototype.toString = function () {
            var str = "";
            for (var i = 0; i < this.size; i++) {
                str += this.v[i] + ",";
            }
            return str.slice(0, -1);
        };
        Vector.clone = function (v) {
            return new Vector(v.size, v.v);
        };
        return Vector;
    }());
    gml.Vector = Vector;
})(gml || (gml = {}));
///<reference path="vec.ts"/>
var gml;
(function (gml) {
    var Matrix = /** @class */ (function () {
        function Matrix(rows, cols) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.rows = rows;
            this.cols = cols;
            var size = rows * cols;
            this.v = new Float32Array(size);
            if (args.length == 0) {
                return;
            }
            else if (args.length == 1) {
                var arr = args[0];
                if (arr instanceof Float32Array) {
                    this.v = arr;
                }
                else if (arr instanceof Array) {
                    for (var i = 0; i < size; i++) {
                        this.v[i] = arr[i];
                    }
                }
            }
            else {
                for (var i = 0; i < size; i++) {
                    this.v[i] = args[i];
                }
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
                var out = new Matrix(this.rows, arg.cols, new Float32Array(this.rows * arg.cols));
                Matrix.matmul(this, arg, out);
                return out;
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
        Matrix.matmul = function (lhs, rhs, out) {
            if (lhs.rows != rhs.cols) {
                console.warn("lhs and rhs incompatible for matrix multiplication!");
                return null;
            }
            for (var i = 0; i < lhs.rows; i++) {
                for (var j = 0; j < rhs.cols; j++) {
                    var sum = 0;
                    for (var k = 0; k < lhs.cols; k++) {
                        sum += lhs.get(i, k) * rhs.get(k, j);
                    }
                    out.v[i * lhs.cols + j] = sum;
                }
            }
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
    }());
    gml.Matrix = Matrix;
})(gml || (gml = {}));
///<reference path="../mat.ts"/>
var gml;
(function (gml) {
    var Mat3 = /** @class */ (function (_super) {
        __extends(Mat3, _super);
        function Mat3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 3, 3) || this;
            if (args.length === 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
                _this.v[2] = arr[2];
                _this.v[3] = arr[3];
                _this.v[4] = arr[4];
                _this.v[5] = arr[5];
                _this.v[6] = arr[6];
                _this.v[7] = arr[7];
                _this.v[8] = arr[8];
            }
            else {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
                _this.v[2] = args[2];
                _this.v[3] = args[3];
                _this.v[4] = args[4];
                _this.v[5] = args[5];
                _this.v[6] = args[6];
                _this.v[7] = args[7];
                _this.v[8] = args[8];
            }
            return _this;
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
        Object.defineProperty(Mat3.prototype, "determinant", {
            /**
             * @returns the determinant of this 3x3 matrix.
             *
             * Hand expanded for speed and to avoid call to Mat.LU, which is unoptimized and
             * expensive for real-time applications.
             */
            get: function () {
                var m00 = this.v[0];
                var m01 = this.v[1];
                var m02 = this.v[2];
                var m10 = this.v[3];
                var m11 = this.v[4];
                var m12 = this.v[5];
                var m20 = this.v[6];
                var m21 = this.v[7];
                var m22 = this.v[8];
                return m00 * m11 * m22 - m00 * m12 * m21 + m01 * m12 * m20 - m01 * m10 * m22;
            },
            enumerable: true,
            configurable: true
        });
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
    }(gml.Matrix));
    gml.Mat3 = Mat3;
})(gml || (gml = {}));
///<reference path="../mat.ts"/>
var gml;
(function (gml) {
    var Mat4 = /** @class */ (function (_super) {
        __extends(Mat4, _super);
        function Mat4() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 4, 4) || this;
            if (args.length === 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
                _this.v[2] = arr[2];
                _this.v[3] = arr[3];
                _this.v[4] = arr[4];
                _this.v[5] = arr[5];
                _this.v[6] = arr[6];
                _this.v[7] = arr[7];
                _this.v[8] = arr[8];
                _this.v[9] = arr[9];
                _this.v[10] = arr[10];
                _this.v[11] = arr[11];
                _this.v[12] = arr[12];
                _this.v[13] = arr[13];
                _this.v[14] = arr[14];
                _this.v[15] = arr[15];
            }
            else {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
                _this.v[2] = args[2];
                _this.v[3] = args[3];
                _this.v[4] = args[4];
                _this.v[5] = args[5];
                _this.v[6] = args[6];
                _this.v[7] = args[7];
                _this.v[8] = args[8];
                _this.v[9] = args[9];
                _this.v[10] = args[10];
                _this.v[11] = args[11];
                _this.v[12] = args[12];
                _this.v[13] = args[13];
                _this.v[14] = args[14];
                _this.v[15] = args[15];
            }
            return _this;
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
                var m00 = this.v[0];
                var m01 = this.v[1];
                var m02 = this.v[2];
                var m10 = this.v[4];
                var m11 = this.v[5];
                var m12 = this.v[6];
                var m20 = this.v[8];
                var m21 = this.v[9];
                var m22 = this.v[10];
                // scale is the length of each corresponding column vector
                return new gml.Vec3(Math.sqrt(m00 * m00 + m10 * m10 + m20 * m20), Math.sqrt(m01 * m01 + m11 * m11 + m21 * m21), Math.sqrt(m02 * m02 + m12 * m12 + m22 * m22));
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
                var out = Mat4.identity();
                Mat4.matmul(this, arg, out);
                return out;
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
        /**
         * @returns the inverse of this 4x4 matrix.
         *
         * Hand expanded for speed. Returns the identity matrix if this matrix is singular.
         */
        Mat4.prototype.invert = function () {
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
            var a00 = m03 * m11 - m01 * m13;
            var a01 = m20 * m32 - m22 * m30;
            var a02 = m00 * m13 - m03 * m10;
            var a03 = m21 * m32 - m22 * m31;
            var a04 = m02 * m10 - m00 * m12;
            var a05 = m21 * m33 - m23 * m31;
            var a06 = m00 * m11 - m01 * m10;
            var a07 = m22 * m33 - m23 * m32;
            var a08 = m02 * m11 - m01 * m12;
            var a09 = m23 * m30 - m20 * m33;
            var a10 = m03 * m12 - m02 * m13;
            var a11 = m21 * m30 - m20 * m31;
            var det = a00 * a01 + a02 * a03 + a04 * a05 + a06 * a07 + a08 * a09 + a10 * a11;
            if (det == 0)
                return Mat4.identity(); // fail
            var f = 1 / det;
            /* given the expanded form of the 4x4 inverse:
             *
             *    ( f * ( -m13 * m22 * m31 + m12 * m23 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33 )
             *    , f * (  m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33 )
             *    , f * ( -m03 * m12 * m31 + m02 * m13 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33 )
             *    , f * (  m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23 )
             *
             *    , f * (  m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33 )
             *    , f * ( -m03 * m22 * m30 + m02 * m23 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33 )
             *    , f * (  m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33 )
             *    , f * ( -m03 * m12 * m20 + m02 * m13 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23 )
             *
             *    , f * ( -m13 * m21 * m30 + m11 * m23 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33 )
             *    , f * (  m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33 )
             *    , f * ( -m03 * m11 * m30 + m01 * m13 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33 )
             *    , f * (  m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23 )
             *
             *    , f * (  m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32 )
             *    , f * ( -m02 * m21 * m30 + m01 * m22 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32 )
             *    , f * (  m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32 )
             *    , f * ( -m02 * m11 * m20 + m01 * m12 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22 ) )
             *
             * rearrange to match terms a00-a11 from determinant computation:
             *
             *    ( f * (  m13 * m21 * m32 - m13 * m22 * m31 - m12 * m21 * m33 + m12 * m23 * m31 + m11 * m22 * m33 - m11 * m23 * m32 )
             *    , f * ( -m03 * m21 * m32 + m03 * m22 * m31 + m02 * m21 * m33 - m02 * m23 * m31 - m01 * m22 * m33 + m01 * m23 * m32 )
             *    , f * ( -m31 * m03 * m12 + m31 * m02 * m13 + m32 * m03 * m11 - m32 * m01 * m13 - m33 * m02 * m11 + m33 * m01 * m12 )
             *    , f * (  m21 * m03 * m12 - m21 * m02 * m13 - m22 * m03 * m11 + m22 * m01 * m13 + m23 * m02 * m11 - m23 * m01 * m12 )
             *
             *    , f * ( -m13 * m20 * m32 + m13 * m22 * m30 - m12 * m23 * m30 + m12 * m20 * m33 + m10 * m23 * m32 - m10 * m22 * m33 )
             *    , f * (  m03 * m20 * m32 - m03 * m22 * m30 + m02 * m23 * m30 - m02 * m20 * m33 - m00 * m23 * m32 + m00 * m22 * m33 )
             *    , f * (  m30 * m03 * m12 - m30 * m02 * m13 + m32 * m00 * m13 - m32 * m03 * m10 + m33 * m02 * m10 - m33 * m00 * m12 )
             *    , f * ( -m20 * m03 * m12 + m20 * m02 * m13 - m22 * m00 * m13 + m22 * m03 * m10 - m23 * m02 * m10 + m23 * m00 * m12 )
             *
             *    , f * ( -m13 * m21 * m30 + m13 * m20 * m31 + m11 * m23 * m30 - m11 * m20 * m33 + m10 * m21 * m33 - m10 * m23 * m31 )
             *    , f * (  m03 * m21 * m30 - m03 * m20 * m31 - m01 * m23 * m30 + m01 * m20 * m33 - m00 * m21 * m33 + m00 * m23 * m31 )
             *    , f * ( -m30 * m03 * m11 + m30 * m01 * m13 - m31 * m00 * m13 + m31 * m03 * m10 + m33 * m00 * m11 - m33 * m01 * m10 )
             *    , f * (  m20 * m03 * m11 - m20 * m01 * m13 + m21 * m00 * m13 - m21 * m03 * m10 - m23 * m00 * m11 + m23 * m01 * m10 )
             *
             *    , f * (  m12 * m21 * m30 - m12 * m20 * m31 + m11 * m20 * m32 - m11 * m22 * m30 - m10 * m21 * m32 + m10 * m22 * m31 )
             *    , f * ( -m02 * m21 * m30 + m02 * m20 * m31 - m01 * m20 * m32 + m01 * m22 * m30 + m00 * m21 * m32 - m00 * m22 * m31 )
             *    , f * (  m30 * m02 * m11 - m30 * m01 * m12 - m31 * m02 * m10 + m31 * m00 * m12 - m32 * m00 * m11 + m32 * m01 * m10 )
             *    , f * ( -m20 * m02 * m11 + m20 * m01 * m12 + m21 * m02 * m10 - m21 * m00 * m12 + m22 * m00 * m11 - m22 * m01 * m10 ) );
             *
             * then factor:
             *
             *    ( f * (  m13 * ( m21 * m32 - m22 * m31 ) - m12 * ( m21 * m33 - m23 * m31 ) + m11 * ( m22 * m33 - m23 * m32 ) )
             *    , f * ( -m03 * ( m21 * m32 - m22 * m31 ) + m02 * ( m21 * m33 - m23 * m31 ) - m01 * ( m22 * m33 - m23 * m32 ) )
             *    , f * ( -m31 * ( m03 * m12 - m02 * m13 ) + m32 * ( m03 * m11 - m01 * m13 ) - m33 * ( m02 * m11 - m01 * m12 ) )
             *    , f * (  m21 * ( m03 * m12 - m02 * m13 ) - m22 * ( m03 * m11 - m01 * m13 ) + m23 * ( m02 * m11 - m01 * m12 ) )
             *
             *    , f * ( -m13 * ( m20 * m32 - m22 * m30 ) - m12 * ( m23 * m30 - m20 * m33 ) + m10 * ( m23 * m32 - m22 * m33 ) )
             *    , f * (  m03 * ( m20 * m32 - m22 * m30 ) + m02 * ( m23 * m30 - m20 * m33 ) - m00 * ( m23 * m32 - m22 * m33 ) )
             *    , f * (  m30 * ( m03 * m12 - m02 * m13 ) + m32 * ( m00 * m13 - m03 * m10 ) + m33 * ( m02 * m10 - m00 * m12 ) )
             *    , f * ( -m20 * ( m03 * m12 - m02 * m13 ) - m22 * ( m00 * m13 - m03 * m10 ) - m23 * ( m02 * m10 - m00 * m12 ) )
             *
             *    , f * ( -m13 * ( m21 * m30 - m20 * m31 ) + m11 * ( m23 * m30 - m20 * m33 ) + m10 * ( m21 * m33 - m23 * m31 ) )
             *    , f * (  m03 * ( m21 * m30 - m20 * m31 ) - m01 * ( m23 * m30 - m20 * m33 ) - m00 * ( m21 * m33 - m23 * m31 ) )
             *    , f * ( -m30 * ( m03 * m11 - m01 * m13 ) - m31 * ( m00 * m13 - m03 * m10 ) + m33 * ( m00 * m11 - m01 * m10 ) )
             *    , f * (  m20 * ( m03 * m11 - m01 * m13 ) + m21 * ( m00 * m13 - m03 * m10 ) - m23 * ( m00 * m11 - m01 * m10 ) )
             *
             *    , f * (  m12 * ( m21 * m30 - m20 * m31 ) + m11 * ( m20 * m32 - m22 * m30 ) - m10 * ( m21 * m32 - m22 * m31 ) )
             *    , f * ( -m02 * ( m21 * m30 - m20 * m31 ) - m01 * ( m20 * m32 - m22 * m30 ) + m00 * ( m21 * m32 - m22 * m31 ) )
             *    , f * (  m30 * ( m02 * m11 - m01 * m12 ) - m31 * ( m02 * m10 - m00 * m12 ) - m32 * ( m00 * m11 - m01 * m10 ) )
             *    , f * ( -m20 * ( m02 * m11 - m01 * m12 ) + m21 * ( m02 * m10 - m00 * m12 ) + m22 * ( m00 * m11 - m01 * m10 ) ) );
             *
             * and finally, substitute terms to arrive at the result:
             */
            return new Mat4(f * (m13 * a03 - m12 * a05 + m11 * a07), f * (-m03 * a03 + m02 * a05 - m01 * a07), f * (-m31 * a10 + m32 * a00 - m33 * a08), f * (m21 * a10 - m22 * a00 + m23 * a08), f * (-m13 * a01 - m12 * a09 - m10 * a07), f * (m03 * a01 + m02 * a09 + m00 * a07), f * (m30 * a10 + m32 * a02 + m33 * a04), f * (-m20 * a10 - m22 * a02 - m23 * a04), f * (-m13 * a11 + m11 * a09 + m10 * a05), f * (m03 * a11 - m01 * a09 - m00 * a05), f * (-m30 * a00 - m31 * a02 + m33 * a06), f * (m20 * a00 + m21 * a02 - m23 * a06), f * (m12 * a11 + m11 * a01 - m10 * a03), f * (-m02 * a11 - m01 * a01 + m00 * a03), f * (m30 * a08 - m31 * a04 - m32 * a06), f * (-m20 * a08 + m21 * a04 + m22 * a06));
        };
        Object.defineProperty(Mat4.prototype, "determinant", {
            /**
             * @returns the determinant of this 4x4 matrix.
             *
             * Hand expanded for speed and to avoid call to Mat.LU, which is unoptimized and
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
                /* to derive:
                 * expand the Leibniz formula (or Sarrus's rule) to arrive at the following closed form:
                 *
                 *     m03 * m12 * m21 * m30 - m02 * m13 * m21 * m30 - m03 * m11 * m22 * m30 + m01 * m13 * m22 * m30 +
                 *     m02 * m11 * m23 * m30 - m01 * m12 * m23 * m30 - m03 * m12 * m20 * m31 + m02 * m13 * m20 * m31 +
                 *     m03 * m10 * m22 * m31 - m00 * m13 * m22 * m31 - m02 * m10 * m23 * m31 + m00 * m12 * m23 * m31 +
                 *     m03 * m11 * m20 * m32 - m01 * m13 * m20 * m32 - m03 * m10 * m21 * m32 + m00 * m13 * m21 * m32 +
                 *     m01 * m10 * m23 * m32 - m00 * m11 * m23 * m32 - m02 * m11 * m20 * m33 + m01 * m12 * m20 * m33 +
                 *     m02 * m10 * m21 * m33 - m00 * m12 * m21 * m33 - m01 * m10 * m22 * m33 + m00 * m11 * m22 * m33;
                 *
                 * then factor out common pairs:
                 *
                 *      m03 * m11 * ( m20 * m32 - m22 * m30 )
                 *      m01 * m13 * ( m22 * m30 - m20 * m32 )
                 *      m00 * m13 * ( m21 * m32 - m22 * m31 )
                 *      m03 * m10 * ( m22 * m31 - m21 * m32 )
                 *      m02 * m10 * ( m21 * m33 - m23 * m31 )
                 *      m00 * m12 * ( m23 * m31 - m21 * m33 )
                 *      m00 * m11 * ( m22 * m33 - m23 * m32 )
                 *      m02 * m11 * ( m23 * m30 - m20 * m33 )
                 *      m01 * m12 * ( m20 * m33 - m23 * m30 )
                 *      m03 * m12 * ( m21 * m30 - m20 * m31 )
                 *      m02 * m13 * ( m20 * m31 - m21 * m30 )
                 *      m01 * m10 * ( m23 * m32 - m22 * m33 )
                 *
                 * one more time, and voila:
                 *
                 *     ( m03 * m11 - m01 * m13 ) * ( m20 * m32 - m22 * m30 )
                 *     ( m00 * m13 - m03 * m10 ) * ( m21 * m32 - m22 * m31 )
                 *     ( m02 * m10 - m00 * m12 ) * ( m21 * m33 - m23 * m31 )
                 *     ( m00 * m11 - m01 * m10 ) * ( m22 * m33 - m23 * m32 )
                 *     ( m02 * m11 - m01 * m12 ) * ( m23 * m30 - m20 * m33 )
                 *     ( m03 * m12 - m02 * m13 ) * ( m21 * m30 - m20 * m31 )
                 */
                var a00 = m03 * m11 - m01 * m13;
                var a01 = m20 * m32 - m22 * m30;
                var a02 = m00 * m13 - m03 * m10;
                var a03 = m21 * m32 - m22 * m31;
                var a04 = m02 * m10 - m00 * m12;
                var a05 = m21 * m33 - m23 * m31;
                var a06 = m00 * m11 - m01 * m10;
                var a07 = m22 * m33 - m23 * m32;
                var a08 = m02 * m11 - m01 * m12;
                var a09 = m23 * m30 - m20 * m33;
                var a10 = m03 * m12 - m02 * m13;
                var a11 = m21 * m30 - m20 * m31;
                return a00 * a01 + a02 * a03 + a04 * a05 + a06 * a07 + a08 * a09 + a10 * a11;
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
        Mat4.matmul = function (lhs, rhs, out) {
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
            out.r00 = l00 * r00 + l01 * r10 + l02 * r20 + l03 * r30;
            out.r01 = l00 * r01 + l01 * r11 + l02 * r21 + l03 * r31;
            out.r02 = l00 * r02 + l01 * r12 + l02 * r22 + l03 * r32;
            out.tx = l00 * r03 + l01 * r13 + l02 * r23 + l03 * r33;
            out.r10 = l10 * r00 + l11 * r10 + l12 * r20 + l13 * r30;
            out.r11 = l10 * r01 + l11 * r11 + l12 * r21 + l13 * r31;
            out.r12 = l10 * r02 + l11 * r12 + l12 * r22 + l13 * r32;
            out.ty = l10 * r03 + l11 * r13 + l12 * r23 + l13 * r33;
            out.r20 = l20 * r00 + l21 * r10 + l22 * r20 + l23 * r30;
            out.r21 = l20 * r01 + l21 * r11 + l22 * r21 + l23 * r31;
            out.r22 = l20 * r02 + l21 * r12 + l22 * r22 + l23 * r32;
            out.tz = l20 * r03 + l21 * r13 + l22 * r23 + l23 * r33;
            out.m30 = l30 * r00 + l31 * r10 + l32 * r20 + l33 * r30;
            out.m31 = l30 * r01 + l31 * r11 + l32 * r21 + l33 * r31;
            out.m32 = l30 * r02 + l31 * r12 + l32 * r22 + l33 * r32;
            out.m33 = l30 * r03 + l31 * r13 + l32 * r23 + l33 * r33;
        };
        Mat4.transform = function (lhs, rhs, out) {
            out.x = lhs.r00 * rhs.x + lhs.r01 * rhs.y + lhs.r02 * rhs.z + lhs.tx * rhs.w;
            out.y = lhs.r10 * rhs.x + lhs.r11 * rhs.y + lhs.r12 * rhs.z + lhs.ty * rhs.w;
            out.z = lhs.r20 * rhs.x + lhs.r21 * rhs.y + lhs.r22 * rhs.z + lhs.tz * rhs.w;
            out.w = lhs.m30 * rhs.x + lhs.m31 * rhs.y + lhs.m32 * rhs.z + lhs.m33 * rhs.w;
        };
        return Mat4;
    }(gml.Matrix));
    gml.Mat4 = Mat4;
    /**
     * @returns a 4x4 matrix that transforms a point in a user-defined view frustum to a point in
     *          a unit cube centered at the origin (IE: camera space to homogenous clip space).
     *          The w-component of the output point is the negated z of the original point in camera
     *          space. Division of the x, y, z-components of the mapped point by the w-component will
     *          provide a point in normalized screen space (both x and y will range from -1 to 1).
     */
    function makePerspective(fov, aspectRatio, near, far) {
        var t = near * Math.tan(fov.toRadians() / 2);
        var r = t * aspectRatio;
        var l = -r;
        var b = -t;
        var n = near;
        var f = far;
        return new Mat4(2 * n / (r - l), 0, (r + l) / (r - l), 0, 0, 2 * n / (t - b), (t + b) / (t - b), 0, 0, 0, -(f + n) / (f - n), -2 * n * f / (f - n), 0, 0, -1, 0);
    }
    gml.makePerspective = makePerspective;
    /**
     * @returns a 4x4 matrix to transform a point in a user-defined cube in view space to a point
     *          in the unit cube centered at the origin (IE: camera space to homogenous clip space).
     *          Useful for projecting UI objects that exist in 3D space.
     */
    function makeOrthographic(fov, aspectRatio, near, far) {
        var t = near * Math.tan(fov.toRadians() / 2);
        var r = t * aspectRatio;
        var l = -r;
        var b = -t;
        var n = near;
        var f = far;
        return new Mat4(2 / (r - l), 0, 0, -(r + l) / (r - l), 0, 2 / (t - b), 0, -(t + b) / (t - b), 0, 0, -2 / (f - n), -(f + n) / (f - n), 0, 0, 0, 1);
    }
    gml.makeOrthographic = makeOrthographic;
    /**
     * @returns a 4x4 matrix to transform a point in world space to a point in camera
     *          space.
     *
     * Aim, up, and right are all vectors that are assumed to be orthogonal. Normalization
     * is performed in this method so they need not be already normalized.
     */
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
var gml;
(function (gml) {
    var Ray = /** @class */ (function () {
        function Ray(p, d) {
            this.point = p;
            this.direction = d;
        }
        Ray.At = function (r, t) {
            var out;
            gml.Vec4.multiply(r.direction, t, out);
            gml.Vec4.add(r.point, out, out);
            return out;
        };
        return Ray;
    }());
    gml.Ray = Ray;
    var Polygon = /** @class */ (function () {
        function Polygon(points) {
            this.points = points;
        }
        return Polygon;
    }());
    gml.Polygon = Polygon;
    var Plane = /** @class */ (function () {
        function Plane(normal, d) {
            this.normal = normal;
            this.d = d;
        }
        Plane.fromCoefficients = function (coeffs) {
            return new Plane(new gml.Vec4(coeffs.x, coeffs.y, coeffs.z, 1), coeffs.w);
        };
        return Plane;
    }());
    gml.Plane = Plane;
})(gml || (gml = {}));
///<reference path="../vec.ts"/>
var gml;
(function (gml) {
    var Vec2 = /** @class */ (function (_super) {
        __extends(Vec2, _super);
        function Vec2() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 2) || this;
            if (args.length == 2) {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
            }
            else if (args.length == 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
            }
            return _this;
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
        Vec2.prototype.add = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length == 2) {
                return new Vec2(this.x + args[0], this.y + args[1]);
            }
            else {
                return new Vec2(this.x + args[0].x, this.y + args[0].y);
            }
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
            return new Vec2(callback(this.v[0]), callback(this.v[1]));
        };
        Vec2.randomInCircle = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec2(Math.random(), Math.random()).normalized.multiply(radius);
        };
        Vec2.add = function (lhs, rhs, out) {
            out.x = lhs.x + rhs.x;
            out.y = lhs.y + rhs.y;
            return out;
        };
        Vec2.subtract = function (lhs, rhs, out) {
            out.x = lhs.x - rhs.x;
            out.y = lhs.y - rhs.y;
            return out;
        };
        Vec2.multiply = function (lhs, s, out) {
            out.x = lhs.x * s;
            out.y = lhs.y * s;
            return out;
        };
        Vec2.divide = function (lhs, d, out) {
            out.x = lhs.x / d;
            out.y = lhs.y / d;
            return out;
        };
        Vec2.negate = function (lhs, out) {
            out.x = -lhs.x;
            out.y = -lhs.y;
            return out;
        };
        Vec2.distance = function (lhs, rhs) {
            var dx = lhs.x - rhs.x;
            var dy = lhs.y - rhs.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        Vec2.distsq = function (lhs, rhs) {
            var dx = lhs.x - rhs.x;
            var dy = lhs.y - rhs.y;
            return dx * dx + dy * dy;
        };
        Object.defineProperty(Vec2, "zero", {
            get: function () {
                return new Vec2(0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec2;
    }(gml.Vector));
    gml.Vec2 = Vec2;
})(gml || (gml = {}));
///<reference path="../vec.ts"/>
var gml;
(function (gml) {
    var Vec3 = /** @class */ (function (_super) {
        __extends(Vec3, _super);
        function Vec3() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 3) || this;
            if (args.length == 3) {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
                _this.v[2] = args[2];
            }
            else if (args.length == 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
                _this.v[2] = arr[2];
            }
            return _this;
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
        Vec3.prototype.add = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length == 3) {
                return new Vec3(this.x + args[0], this.y + args[1], this.z + args[2]);
            }
            else {
                return new Vec3(this.x + args[0].x, this.y + args[0].y, this.z + args[0].z);
            }
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
        Vec3.prototype.dot3 = function (x, y, z) {
            return this.x * x + this.y * y + this.z * z;
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
            return new Vec3(callback(this.v[0]), callback(this.v[1]), callback(this.v[2]));
        };
        Vec3.randomInSphere = function (radius) {
            if (radius === void 0) { radius = 1; }
            return new Vec3(Math.random(), Math.random(), Math.random()).normalized.multiply(radius);
        };
        Vec3.distance = function (lhs, rhs) {
            var dx = lhs.x - rhs.x;
            var dy = lhs.y - rhs.y;
            var dz = lhs.z - rhs.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        };
        Vec3.distsq = function (lhs, rhs) {
            var dx = lhs.x - rhs.x;
            var dy = lhs.y - rhs.y;
            var dz = lhs.z - rhs.z;
            return dx * dx + dy * dy + dz * dz;
        };
        Vec3.add = function (lhs, rhs, out) {
            out.x = lhs.x + rhs.x;
            out.y = lhs.y + rhs.y;
            out.z = lhs.z + rhs.z;
            return out;
        };
        Vec3.subtract = function (lhs, rhs, out) {
            out.x = lhs.x - rhs.x;
            out.y = lhs.y - rhs.y;
            out.z = lhs.z - rhs.z;
            return out;
        };
        Vec3.multiply = function (lhs, s, out) {
            out.x = lhs.x * s;
            out.y = lhs.y * s;
            out.z = lhs.z * s;
            return out;
        };
        Vec3.divide = function (lhs, d, out) {
            out.x = lhs.x / d;
            out.y = lhs.y / d;
            out.z = lhs.z / d;
            return out;
        };
        Vec3.negate = function (lhs, out) {
            out.x = -lhs.x;
            out.y = -lhs.y;
            out.z = -lhs.z;
            return out;
        };
        Object.defineProperty(Vec3, "zero", {
            get: function () {
                return new Vec3(0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Vec3;
    }(gml.Vector));
    gml.Vec3 = Vec3;
})(gml || (gml = {}));
/// <reference path='../vec.ts'/>
var gml;
(function (gml) {
    var Vec4 = /** @class */ (function (_super) {
        __extends(Vec4, _super);
        function Vec4() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 4) || this;
            if (args.length == 4) {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
                _this.v[2] = args[2];
                _this.v[3] = args[3];
            }
            else if (args.length == 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
                _this.v[2] = arr[2];
                _this.v[3] = arr[3];
            }
            return _this;
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
        Vec4.prototype.add = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length == 4) {
                return new Vec4(this.x + args[0], this.y + args[1], this.z + args[2], this.w + args[3]);
            }
            else {
                return new Vec4(this.x + args[0].x, this.y + args[0].y, this.z + args[0].z, this.w + args[0].w);
            }
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
            return new Vec4(callback(this.v[0]), callback(this.v[1]), callback(this.v[2]), callback(this.v[3]));
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
        Vec4.add = function (lhs, rhs, out) {
            out.x = lhs.x + rhs.x;
            out.y = lhs.y + rhs.y;
            out.z = lhs.z + rhs.z;
            out.w = lhs.w + rhs.w;
            return out;
        };
        Vec4.subtract = function (lhs, rhs, out) {
            out.x = lhs.x - rhs.x;
            out.y = lhs.y - rhs.y;
            out.z = lhs.z - rhs.z;
            out.w = lhs.w - rhs.w;
            return out;
        };
        Vec4.multiply = function (lhs, s, out) {
            out.x = lhs.x * s;
            out.y = lhs.y * s;
            out.z = lhs.z * s;
            out.w = lhs.w * s;
            return out;
        };
        Vec4.divide = function (lhs, d, out) {
            out.x = lhs.x / d;
            out.y = lhs.y / d;
            out.z = lhs.z / d;
            out.w = lhs.w / d;
            return out;
        };
        Vec4.negate = function (lhs, out) {
            out.x = -lhs.x;
            out.y = -lhs.y;
            out.z = -lhs.z;
            out.w = -lhs.w;
            return out;
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
    }(gml.Vector));
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
    var Degree = /** @class */ (function () {
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
        Degree.prototype.clamp = function (min, max) {
            if (this.v < min.toDegrees())
                return min;
            if (this.v > max.toDegrees())
                return max;
        };
        Object.defineProperty(Degree, "zero", {
            get: function () {
                return new Degree(0);
            },
            enumerable: true,
            configurable: true
        });
        return Degree;
    }());
    var Radian = /** @class */ (function () {
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
    }());
})(gml || (gml = {}));
///<reference path="vec.ts"/>
var gml;
(function (gml) {
    var Color = /** @class */ (function (_super) {
        __extends(Color, _super);
        function Color() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _this = _super.call(this, 4) || this;
            if (args.length == 4) {
                _this.v[0] = args[0];
                _this.v[1] = args[1];
                _this.v[2] = args[2];
                _this.v[3] = args[3];
            }
            else if (args.length == 1) {
                var arr = args[0];
                _this.v[0] = arr[0];
                _this.v[1] = arr[1];
                _this.v[2] = arr[2];
                _this.v[3] = arr[3];
            }
            return _this;
        }
        Object.defineProperty(Color.prototype, "r", {
            get: function () {
                return this.v[0];
            },
            set: function (r) {
                this.v[0] = r;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "g", {
            get: function () {
                return this.v[1];
            },
            set: function (g) {
                this.v[1] = g;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "b", {
            get: function () {
                return this.v[2];
            },
            set: function (b) {
                this.v[2] = b;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "a", {
            get: function () {
                return this.v[3];
            },
            set: function (a) {
                this.v[3] = a;
            },
            enumerable: true,
            configurable: true
        });
        Color.degamma = function (in_color, out_color) {
            var to_linear = 1.0 / 2.2;
            out_color.r = Math.pow(in_color.r, to_linear);
            out_color.g = Math.pow(in_color.g, to_linear);
            out_color.b = Math.pow(in_color.b, to_linear);
            out_color.a = in_color.a;
        };
        Color.engamma = function (in_color, out_color) {
            var to_srgb = 2.2;
            out_color.r = Math.pow(in_color.r, to_srgb);
            out_color.g = Math.pow(in_color.g, to_srgb);
            out_color.b = Math.pow(in_color.b, to_srgb);
            out_color.a = in_color.a;
        };
        Object.defineProperty(Color, "white", {
            get: function () {
                return new Color(1, 1, 1, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color, "black", {
            get: function () {
                return new Color(0, 0, 0, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color, "transparent_black", {
            get: function () {
                return new Color(0, 0, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        return Color;
    }(gml.Vector));
    gml.Color = Color;
})(gml || (gml = {}));
var gml;
(function (gml) {
    /***
     * Any floating-point value smaller than EPSILON is considered to be zero in this library.
     */
    gml.EPSILON = 1e-6;
})(gml || (gml = {}));
var gml;
(function (gml) {
    /**
     * Implements common easing methods (generally used) for tweening.
     * The easing formulas used here are based on the work by
     * <a href="http://robertpenner.com/easing/">Robert Penner</a>.
     *
     * All methods assume a normalized input t (time) between 0 and 1
     * and returns an output t' between 0 and 1.
     */
    var Easing = /** @class */ (function () {
        function Easing() {
        }
        Easing.QuadIn = function (t) {
            return t * t;
        };
        Easing.QuadOut = function (t) {
            // note that this works out to be the same as
            // 1-(x-1)(x-1)
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
        Easing.QuarticIn = function (t) {
            return t * t * t * t;
        };
        Easing.QuarticOut = function (t) {
            var _t = t - 1;
            return 1 - _t * _t * _t * _t;
        };
        Easing.QuarticInOut = function (t) {
            if (t < 0.5) {
                /* we want verbatim behavior as QuarticIn, except we're passing in t
                 * with a range of 0 to 0.5, and we want the output to also range from
                 * 0 to 0.5.
                 *
                 * we double the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuarticIn function (t*t*t*t), then half the result to get an output
                 * from 0 to 0.5. IE: 0.5*2t*2t*2t*2t. Resolves to 8*t*t*t*t
                 */
                return 8 * t * t * t * t;
            }
            else {
                /* we want verbatim behavior as QuarticOut, except we're passing in t
                 * with a range of 0.5 to 1, and we want the output to also range from
                 * 0.5 to 1.
                 *
                 * we transform the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuarticOut function (t-1)^3 + 1, then transform the result s.t. it is
                 * from 0.5 to 1.
                 */
                var _t = ((t - 0.5) * 2) - 1;
                return (-_t * _t * _t * _t + 1) / 2 + 0.5;
            }
        };
        Easing.QuintIn = function (t) {
            return t * t * t * t * t;
        };
        Easing.QuintOut = function (t) {
            var _t = t - 1;
            return _t * _t * _t * _t * _t + 1;
        };
        Easing.QuintInOut = function (t) {
            if (t < 0.5) {
                /* we want verbatim behavior as QuintIn, except we're passing in t
                 * with a range of 0 to 0.5, and we want the output to also range from
                 * 0 to 0.5.
                 *
                 * we double the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuintIn function (t*t*t*t*t), then half the result to get an output
                 * from 0 to 0.5. IE: 0.5*2t*2t*2t*2t*2t. Resolves to 16*t*t*t*t*t
                 */
                return 16 * t * t * t * t * t;
            }
            else {
                /* we want verbatim behavior as QuintOut, except we're passing in t
                 * with a range of 0.5 to 1, and we want the output to also range from
                 * 0.5 to 1.
                 *
                 * we transform the input parameter s.t. it is 0 to 1, then pass it into
                 * the QuarticOut function (t-1)^5 + 1, then transform the result s.t. it is
                 * from 0.5 to 1.
                 */
                var _t = ((t - 0.5) * 2) - 1;
                return (_t * _t * _t * _t * _t + 1) / 2 + 0.5;
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
            if (t >= 1)
                return 1;
            if (t < 0.5) {
                var _base = base * (2 * t - 1) - 1;
                return Math.pow(2, _base);
            }
            else {
                var _base = -base * (2 * t - 1) - 1;
                return 1 - Math.pow(2, _base);
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
        Easing.ElasticIn = function (t) {
            // elastic easing is essentially a transformation of the dampened sine wave
            // the elastic-ease-in curve looks like the reverse of a dampened sine wave
            if (t == 0)
                return 0;
            if (t == 1)
                return 1;
            var p = 0.3;
            var s = p / 4;
            var _t = t - 1;
            return -Math.pow(2, 10 * _t) * Math.sin((_t - s) * 2 * Math.PI / p);
        };
        Easing.ElasticOut = function (t) {
            // the elastic-ease-in curve looks like the standard version of a dampened sine wave
            if (t == 0)
                return 0;
            if (t == 1)
                return 1;
            var p = 0.3;
            var s = p / 4;
            return Math.pow(2, -10 * t) * Math.sin((t - s) * 2 * Math.PI / p) + 1;
        };
        Easing.ElasticInOut = function (t) {
            if (t == 0)
                return 0;
            if (t == 1)
                return 1;
            var p = 0.45;
            var s = p / 4;
            if (t < 0.5) {
                var _t = 2 * t;
                return -0.5 * Math.pow(2, 10 * (_t - 1)) * Math.sin(((_t - 1) - s) * 2 * Math.PI / p);
            }
            else {
                var _t = 2 * t - 1;
                return 0.5 * Math.pow(2, -10 * _t) * Math.sin((_t - s) * 2 * Math.PI / p) + 1;
            }
        };
        Easing.BounceIn = function (t) {
            return 1 - Easing.BounceOut(1 - t);
        };
        Easing.BounceOut = function (t) {
            if (t < (1 / 2.75)) {
                return 7.5625 * t * t;
            }
            else if (t < (2 / 2.75)) {
                var _t = t - 1.5 / 2.75;
                return 7.5625 * _t * _t + 0.75;
            }
            else if (t < (2.5 / 2.75)) {
                var _t = t - 2.25 / 2.75;
                return 7.5625 * _t * _t + .9375;
            }
            else {
                var _t = t - 2.625 / 2.75;
                return 7.5625 * _t * _t + .984375;
            }
        };
        Easing.BounceInOut = function (t) {
            if (t < 0.5)
                return 0.5 * Easing.BounceIn(2 * t);
            else
                return 0.5 + 0.5 * Easing.BounceOut(2 * t - 1);
        };
        return Easing;
    }());
    gml.Easing = Easing;
})(gml || (gml = {}));
/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
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
var gml;
(function (gml) {
    /**
     * @returns 0 if the number is sufficiently close to 0; -1 if the number is less than 0;
     *          1 if the number is greater than 0.
     */
    function sign(n) {
        return Math.abs(n) < 0.0001 ? 0 : n > 0 ? 1 : -1;
    }
    gml.sign = sign;
    function fract(n) {
        return 0;
    }
    gml.fract = fract;
})(gml || (gml = {}));
var Material = /** @class */ (function () {
    function Material() {
        this.isTextureMapped = false;
    }
    return Material;
}());
///<reference path='material.ts' />
var BlinnPhongMaterial = /** @class */ (function (_super) {
    __extends(BlinnPhongMaterial, _super);
    function BlinnPhongMaterial(ambient, diffuse, specular, emissive, shininess) {
        if (ambient === void 0) { ambient = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (specular === void 0) { specular = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (emissive === void 0) { emissive = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (shininess === void 0) { shininess = 1.0; }
        var _this = _super.call(this) || this;
        _this.ambient = ambient;
        _this.diffuse = diffuse;
        _this.specular = specular;
        _this.emissive = emissive;
        _this.shininess = shininess;
        return _this;
    }
    return BlinnPhongMaterial;
}(Material));
///<reference path='material.ts' />
var CookTorranceMaterial = /** @class */ (function (_super) {
    __extends(CookTorranceMaterial, _super);
    function CookTorranceMaterial(diffuse, specular, roughness, fresnel) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (specular === void 0) { specular = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (roughness === void 0) { roughness = 0.5; }
        if (fresnel === void 0) { fresnel = 1.586; }
        var _this = _super.call(this) || this;
        _this.diffuse = diffuse;
        _this.specular = specular;
        _this.roughness = roughness;
        _this.fresnel = fresnel;
        return _this;
    }
    return CookTorranceMaterial;
}(Material));
///<reference path='material.ts' />
var DebugMaterial = /** @class */ (function (_super) {
    __extends(DebugMaterial, _super);
    function DebugMaterial() {
        return _super.call(this) || this;
    }
    return DebugMaterial;
}(Material));
///<reference path='material.ts' />
var LambertMaterial = /** @class */ (function (_super) {
    __extends(LambertMaterial, _super);
    function LambertMaterial(diffuse) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        var _this = _super.call(this) || this;
        _this.diffuse = diffuse;
        return _this;
    }
    return LambertMaterial;
}(Material));
///<reference path='material.ts' />
var NoiseMaterial = /** @class */ (function (_super) {
    __extends(NoiseMaterial, _super);
    function NoiseMaterial() {
        var _this = _super.call(this) || this;
        _this.layer = 0;
        return _this;
    }
    return NoiseMaterial;
}(Material));
///<reference path='material.ts' />
var OrenNayarMaterial = /** @class */ (function (_super) {
    __extends(OrenNayarMaterial, _super);
    function OrenNayarMaterial(diffuse, roughness) {
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (roughness === void 0) { roughness = 0.5; }
        var _this = _super.call(this) || this;
        _this.diffuse = diffuse;
        _this.roughness = roughness;
        return _this;
    }
    return OrenNayarMaterial;
}(Material));
///<reference path='material.ts' />
var VolumeMaterial = /** @class */ (function (_super) {
    __extends(VolumeMaterial, _super);
    function VolumeMaterial(volumeTexture) {
        var _this = _super.call(this) || this;
        _this.layer = 0;
        _this.volumeTexture = volumeTexture;
        return _this;
    }
    return VolumeMaterial;
}(Material));
///<reference path='material.ts' />
var WaterMaterial = /** @class */ (function (_super) {
    __extends(WaterMaterial, _super);
    function WaterMaterial(ambient, diffuse, specular, emissive, shininess, screenspace) {
        if (ambient === void 0) { ambient = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (diffuse === void 0) { diffuse = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (specular === void 0) { specular = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (emissive === void 0) { emissive = new gml.Vec4(0.5, 0.5, 0.5, 1); }
        if (shininess === void 0) { shininess = 1.0; }
        if (screenspace === void 0) { screenspace = false; }
        var _this = _super.call(this) || this;
        _this.ambient = ambient;
        _this.diffuse = diffuse;
        _this.specular = specular;
        _this.emissive = emissive;
        _this.shininess = shininess;
        _this.screenspace = screenspace;
        _this.speed = 1.0;
        _this.wireframe = false;
        return _this;
    }
    return WaterMaterial;
}(Material));
//
// prim.ts
// user editable primitive base interface
var RenderData = /** @class */ (function () {
    function RenderData() {
        this.dirty = true;
        this.vertices = new Float32Array(0);
        this.normals = new Float32Array(0);
        this.meshCoords = new Float32Array(0);
        this.colors = new Float32Array(0);
        this.indices = new Uint32Array(0);
        this.isTextureMapped = false;
        this.vertexBuffer = null;
        this.vertexNormalBuffer = null;
        this.vertexTexCoordBuffer = null;
        this.meshCoordsBuffer = null;
        this.indexBuffer = null;
    }
    RenderData.prototype.rebuildBufferObjects = function (gl) {
        // build the buffer objects
        if (this.vertexBuffer == null) {
            this.vertexBuffer = gl.createBuffer();
        }
        if (this.vertexNormalBuffer == null) {
            this.vertexNormalBuffer = gl.createBuffer();
        }
        if (this.indexBuffer == null) {
            this.indexBuffer = gl.createBuffer();
        }
        if (this.vertexTexCoordBuffer == null) {
            this.vertexTexCoordBuffer = gl.createBuffer();
        }
        if (this.meshCoordsBuffer == null) {
            this.meshCoordsBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW); // allocate and fill the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.meshCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.meshCoords, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.textureCoords, gl.STATIC_DRAW);
    };
    return RenderData;
}());
var Primitive = /** @class */ (function () {
    function Primitive() {
        this.transform = gml.Mat4.identity();
    }
    Primitive.prototype.translate = function (dist) {
        this.transform.translation = dist;
    };
    return Primitive;
}());
///<reference path='prim.ts' />
var Cone = /** @class */ (function (_super) {
    __extends(Cone, _super);
    function Cone(size) {
        if (size === void 0) { size = 1; }
        var _this = _super.call(this) || this;
        _this.transform.scale = new gml.Vec3(size, size, size);
        _this.material = new BlinnPhongMaterial();
        _this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        return _this;
    }
    // this should only be called by the renderer module
    Cone.prototype.rebuildRenderData = function (gl) {
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
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return Cone;
}(Primitive));
///<reference path='prim.ts' />
var Cube = /** @class */ (function (_super) {
    __extends(Cube, _super);
    function Cube(size, position, mat) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        var _this = _super.call(this) || this;
        _this.transform.scale = new gml.Vec3(size, size, size);
        _this.material = mat;
        _this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        return _this;
    }
    // this should only be called by the renderer module
    Cube.prototype.rebuildRenderData = function (gl) {
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
            var uvs = [
                // Front face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Back face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                // Top face
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                // Bottom face
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                // Right face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                // Left face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
            ];
            this.renderData.textureCoords = new Float32Array(uvs);
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
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return Cube;
}(Primitive));
///<reference path='prim.ts' />
// like a regular plane but with a large shell around the center subdivided plane
var InfinitePlane = /** @class */ (function (_super) {
    __extends(InfinitePlane, _super);
    function InfinitePlane(size, layers, position, rotation, subdivisions, mat) {
        if (size === void 0) { size = 1; }
        if (layers === void 0) { layers = 3; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (rotation === void 0) { rotation = null; }
        if (subdivisions === void 0) { subdivisions = { u: 0, v: 0 }; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        var _this = _super.call(this) || this;
        _this.subdivs = subdivisions;
        _this.transform = gml.Mat4.identity();
        _this.layers = layers;
        if (rotation != null) {
            var m = gml.Mat4.identity();
            var sx = Math.sin(rotation.x.toRadians());
            var cx = Math.cos(rotation.x.toRadians());
            var sy = Math.sin(rotation.y.toRadians());
            var cy = Math.cos(rotation.y.toRadians());
            var sz = Math.sin(rotation.z.toRadians());
            var cz = Math.cos(rotation.z.toRadians());
            m.r00 = cz * cy;
            m.r01 = sz * cy;
            m.r02 = -sy;
            m.r10 = cz * sy * sx - sz * cx;
            m.r11 = sz * sy * sx + cz * cx;
            m.r12 = cy * sx;
            m.r20 = cz * sy * cx + sz * sx;
            m.r21 = sz * sy * cx - cz * sx;
            m.r22 = cy * cx;
            m.m33 = 1;
            m.m30 = 0;
            m.m31 = 0;
            m.m32 = 0;
            m.tx = 0;
            m.ty = 0;
            m.tz = 0;
            _this.transform = m.multiply(_this.transform);
        }
        {
            var m = gml.Mat4.identity();
            m.scale = new gml.Vec3(size, size, size);
            _this.transform = m.multiply(_this.transform);
        }
        _this.transform.translation = position;
        _this.renderData = new RenderData();
        _this.material = mat;
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        return _this;
    }
    InfinitePlane.prototype.subdivide = function (min, max, times) {
        var subdivided = [min, max];
        for (var iter = 0; iter < times; iter++) {
            var intermediate = [];
            for (var i = 0; i < subdivided.length - 1; i++) {
                intermediate.push(subdivided[i]);
                intermediate.push((subdivided[i] + subdivided[i + 1]) / 2);
            }
            intermediate.push(subdivided[subdivided.length - 1]);
            subdivided = intermediate;
        }
        return subdivided;
    };
    InfinitePlane.prototype.pushVertices = function (xs, ys, vertices) {
        for (var i = 0; i < ys.length; i++) {
            for (var j = 0; j < xs.length; j++) {
                vertices.push(xs[j]);
                vertices.push(0);
                vertices.push(ys[i]);
            }
        }
    };
    InfinitePlane.prototype.pushUVs = function (us, vs, uvs) {
        for (var i = 0; i < vs.length; i++) {
            for (var j = 0; j < us.length; j++) {
                uvs.push(us[j]);
                uvs.push(vs[i]);
            }
        }
    };
    InfinitePlane.prototype.pushMeshCoords = function (xs, ys, coords) {
        for (var i = 0; i < xs.length; i++) {
            for (var j = 0; j < ys.length; j++) {
                coords.push(xs[i]);
                coords.push(ys[j]);
            }
        }
    };
    // pushes indices for a subdivided quad
    InfinitePlane.prototype.pushIndices = function (offset, cols, rows, planeVertexIndices) {
        for (var i = 0; i < rows - 1; i++) {
            for (var j = 0; j < cols - 1; j++) {
                // *-*
                //  \|
                //   *
                planeVertexIndices.push(offset + i * cols + j); // top left
                planeVertexIndices.push(offset + i * cols + j + 1); // top right
                planeVertexIndices.push(offset + (i + 1) * cols + j + 1); // bottom right
                // *
                // |\
                // *-*
                planeVertexIndices.push(offset + i * cols * 1 + j); // top left
                planeVertexIndices.push(offset + (i + 1) * cols + j + 1); // bottom right
                planeVertexIndices.push(offset + (i + 1) * cols + j); // bottom left
            }
        }
    };
    // this should only be called by the renderer module
    InfinitePlane.prototype.rebuildRenderData = function (gl) {
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
            var vertices = [];
            var uvs = [];
            var planeVertexIndices = [];
            var meshCoords = [];
            var centerSize = 2;
            // center quad
            {
                var xs = this.subdivide(-centerSize / 2, centerSize / 2, this.subdivs.u);
                var ys = this.subdivide(centerSize / 2, -centerSize / 2, this.subdivs.v);
                var us = this.subdivide(0, 1, this.subdivs.u);
                var vs = this.subdivide(0, 1, this.subdivs.v);
                var mxs = this.subdivide(0, 1 << this.subdivs.u, this.subdivs.u);
                var mys = this.subdivide(0, 1 << this.subdivs.v, this.subdivs.v);
                this.pushVertices(xs, ys, vertices);
                this.pushUVs(us, vs, uvs);
                this.pushMeshCoords(mxs, mys, meshCoords);
                this.pushIndices(0, xs.length, ys.length, planeVertexIndices);
            }
            var inner_tl = new gml.Vec2(-1, 1);
            var inner_br = new gml.Vec2(1, -1);
            // shells
            //
            // reference layout:
            // +---+---+---+---+
            // | 0 | 1 | 2 | 3 |
            // +---+-------+---+
            // | 11|       | 4 |
            // +---|       |---+
            // | 10|       | 5 |
            // +---+-------+---+
            // | 9 | 8 | 7 | 6 |
            // +---+---+---+---+
            var lastSize = centerSize;
            for (var layer = 0; layer < this.layers; layer++) {
                var size = lastSize / 2;
                var outer_tl = inner_tl.add(-size, size);
                var outer_br = inner_br.add(size, -size);
                // shell 0
                {
                    var xs = this.subdivide(outer_tl.x, inner_tl.x, 5);
                    var ys = this.subdivide(outer_tl.y, inner_tl.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 1
                {
                    var xs = this.subdivide(inner_tl.x, inner_tl.x + size, 5);
                    var ys = this.subdivide(outer_tl.y, inner_tl.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 2
                {
                    var xs = this.subdivide(inner_tl.x + size, inner_tl.x + 2 * size, 5);
                    var ys = this.subdivide(outer_tl.y, inner_tl.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 3
                {
                    var xs = this.subdivide(inner_tl.x + 2 * size, outer_br.x, 5);
                    var ys = this.subdivide(outer_tl.y, inner_tl.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 4
                {
                    var xs = this.subdivide(outer_br.x - size, outer_br.x, 5);
                    var ys = this.subdivide(inner_tl.y, inner_tl.y - size, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 5
                {
                    var xs = this.subdivide(outer_br.x - size, outer_br.x, 5);
                    var ys = this.subdivide(inner_tl.y - size, inner_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 5
                {
                    var xs = this.subdivide(outer_br.x - size, outer_br.x, 5);
                    var ys = this.subdivide(inner_br.y, outer_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 7
                {
                    var xs = this.subdivide(inner_tl.x + size, inner_tl.x + 2 * size, 5);
                    var ys = this.subdivide(inner_br.y, outer_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 8
                {
                    var xs = this.subdivide(inner_tl.x, inner_tl.x + size, 5);
                    var ys = this.subdivide(inner_br.y, outer_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 9
                {
                    var xs = this.subdivide(outer_tl.x, inner_tl.x, 5);
                    var ys = this.subdivide(inner_br.y, outer_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 10
                {
                    var xs = this.subdivide(outer_tl.x, inner_tl.x, 5);
                    var ys = this.subdivide(inner_tl.y - size, inner_br.y, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                // shell 11
                {
                    var xs = this.subdivide(outer_tl.x, inner_tl.x, 5);
                    var ys = this.subdivide(inner_tl.y, inner_tl.y - size, 5);
                    var us = this.subdivide(0, 1, 5);
                    var vs = this.subdivide(0, 1, 5);
                    var mxs = this.subdivide(0, 1 << 5, 5);
                    var mys = this.subdivide(0, 1 << 5, 5);
                    var offset = vertices.length / 3;
                    this.pushVertices(xs, ys, vertices);
                    this.pushUVs(us, vs, uvs);
                    this.pushMeshCoords(mxs, mys, meshCoords);
                    this.pushIndices(offset, xs.length, ys.length, planeVertexIndices);
                }
                lastSize *= 2;
                inner_tl = outer_tl;
                inner_br = outer_br;
            }
            this.renderData.vertices = new Float32Array(vertices);
            this.renderData.textureCoords = new Float32Array(uvs);
            this.renderData.meshCoords = new Float32Array(meshCoords);
            var vertexNormals = [];
            // flat plane; normals are all the same
            for (var i = 0; i < vertices.length / 3; i++) {
                vertexNormals.push(0.0);
                vertexNormals.push(1.0);
                vertexNormals.push(0.0);
            }
            this.renderData.normals = new Float32Array(vertexNormals);
            this.renderData.indices = new Uint32Array(planeVertexIndices);
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return InfinitePlane;
}(Primitive));
///<reference path='prim.ts' />
var Plane = /** @class */ (function (_super) {
    __extends(Plane, _super);
    function Plane(size, position, rotation, subdivisions, mat) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (rotation === void 0) { rotation = null; }
        if (subdivisions === void 0) { subdivisions = { u: 0, v: 0 }; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        var _this = _super.call(this) || this;
        _this.transform = gml.Mat4.identity();
        _this.subdivs = subdivisions;
        if (rotation != null) {
            var m = gml.Mat4.identity();
            var sx = Math.sin(rotation.x.toRadians());
            var cx = Math.cos(rotation.x.toRadians());
            var sy = Math.sin(rotation.y.toRadians());
            var cy = Math.cos(rotation.y.toRadians());
            var sz = Math.sin(rotation.z.toRadians());
            var cz = Math.cos(rotation.z.toRadians());
            m.r00 = cz * cy;
            m.r01 = sz * cy;
            m.r02 = -sy;
            m.r10 = cz * sy * sx - sz * cx;
            m.r11 = sz * sy * sx + cz * cx;
            m.r12 = cy * sx;
            m.r20 = cz * sy * cx + sz * sx;
            m.r21 = sz * sy * cx - cz * sx;
            m.r22 = cy * cx;
            m.m33 = 1;
            m.m30 = 0;
            m.m31 = 0;
            m.m32 = 0;
            m.tx = 0;
            m.ty = 0;
            m.tz = 0;
            _this.transform = m.multiply(_this.transform);
        }
        {
            var m = gml.Mat4.identity();
            m.scale = new gml.Vec3(size, size, size);
            _this.transform = m.multiply(_this.transform);
        }
        _this.transform.translation = position;
        _this.renderData = new RenderData();
        _this.material = mat;
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        return _this;
    }
    // this should only be called by the renderer module
    Plane.prototype.rebuildRenderData = function (gl) {
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
            // By default 4-vertex plane (no subdivisions) is in XY plane with z = 0
            // Create values for each axis in its own array for easier subdivision implementation
            var xs = [-1, 1]; // left to right
            var ys = [1, -1]; // top to bottom
            var us = [0, 1]; // left to right
            var vs = [0, 1]; // top to bottom
            // perform X subdivision (subdivisions along x-axis)
            for (var iter = 0; iter < this.subdivs.u; iter++) {
                var subdivided = [];
                for (var i = 0; i < xs.length - 1; i++) {
                    subdivided.push(xs[i]);
                    subdivided.push((xs[i] + xs[i + 1]) / 2);
                }
                subdivided.push(xs[xs.length - 1]);
                xs = subdivided;
                var subdivided_us = [];
                for (var i = 0; i < us.length - 1; i++) {
                    subdivided_us.push(us[i]);
                    subdivided_us.push((us[i] + us[i + 1]) / 2);
                }
                subdivided_us.push(us[us.length - 1]);
                us = subdivided_us;
            }
            // perform Y subdivision (subdivisions along x-axis)
            for (var iter = 0; iter < this.subdivs.v; iter++) {
                var subdivided = [];
                for (var i = 0; i < ys.length - 1; i++) {
                    subdivided.push(ys[i]);
                    subdivided.push((ys[i] + ys[i + 1]) / 2);
                }
                subdivided.push(ys[ys.length - 1]);
                ys = subdivided;
                var subdivided_vs = [];
                for (var i = 0; i < vs.length - 1; i++) {
                    subdivided_vs.push(vs[i]);
                    subdivided_vs.push((vs[i] + vs[i + 1]) / 2);
                }
                subdivided_vs.push(vs[vs.length - 1]);
                vs = subdivided_vs;
            }
            // combine xys into vertex position array
            // going left to right, top to bottom (row major flat array)
            var vertices = [];
            for (var i = 0; i < ys.length; i++) {
                for (var j = 0; j < xs.length; j++) {
                    vertices.push(xs[j]);
                    vertices.push(0);
                    vertices.push(ys[i]);
                }
            }
            this.renderData.vertices = new Float32Array(vertices);
            var uvs = [];
            for (var i = 0; i < vs.length; i++) {
                for (var j = 0; j < us.length; j++) {
                    uvs.push(us[j]);
                    uvs.push(vs[i]);
                }
            }
            this.renderData.textureCoords = new Float32Array(uvs);
            var vertexNormals = [];
            // flat plane; normals are all the same
            for (var i = 0; i < vertices.length / 3; i++) {
                vertexNormals.push(0.0);
                vertexNormals.push(1.0);
                vertexNormals.push(0.0);
            }
            this.renderData.normals = new Float32Array(vertexNormals);
            var planeVertexIndices = [];
            // push two triangles (1 quad) each iteration
            for (var i = 0; i < vs.length - 1; i++) {
                for (var j = 0; j < us.length - 1; j++) {
                    // *-*
                    //  \|
                    //   *
                    planeVertexIndices.push(i * us.length + j); // top left
                    planeVertexIndices.push(i * us.length + j + 1); // top right
                    planeVertexIndices.push((i + 1) * us.length + j + 1); // bottom right
                    // *
                    // |\
                    // *-*
                    planeVertexIndices.push(i * us.length * 1 + j); // top left
                    planeVertexIndices.push((i + 1) * us.length + j + 1); // bottom right
                    planeVertexIndices.push((i + 1) * us.length + j); // bottom left
                }
            }
            this.renderData.indices = new Uint32Array(planeVertexIndices);
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return Plane;
}(Primitive));
///<reference path='prim.ts' />
var Quad = /** @class */ (function (_super) {
    __extends(Quad, _super);
    function Quad(size, position, rotation, mat) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (rotation === void 0) { rotation = null; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        var _this = _super.call(this) || this;
        _this.transform.scale = new gml.Vec3(size, size, size);
        if (rotation != null) {
            var m = gml.Mat4.identity();
            var sx = Math.sin(rotation.x.toRadians());
            var cx = Math.cos(rotation.x.toRadians());
            var sy = Math.sin(rotation.y.toRadians());
            var cy = Math.cos(rotation.y.toRadians());
            var sz = Math.sin(rotation.z.toRadians());
            var cz = Math.cos(rotation.z.toRadians());
            m.r00 = size * cz * cy;
            m.r01 = sz * cy;
            m.r02 = -sy;
            m.r10 = cz * sy * sx - sz * cx;
            m.r11 = sz * sy * sx + cz * cx;
            m.r12 = cy * sx;
            m.r20 = cz * sy * cx + sz * sx;
            m.r21 = sz * sy * cx - cz * sx;
            m.r22 = cy * cx;
            m.m33 = 1;
            m.m30 = 0;
            m.m31 = 0;
            m.m32 = 0;
            m.tx = 0;
            m.ty = 0;
            m.tz = 0;
            _this.transform = m.multiply(_this.transform);
        }
        _this.transform.translation = position;
        _this.renderData = new RenderData();
        _this.material = mat;
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        return _this;
    }
    // this should only be called by the renderer module
    Quad.prototype.rebuildRenderData = function (gl) {
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
            var uvs = [
                0.0, 1.0,
                1.0, 1.0,
                1.0, 0.0,
                0.0, 0.0,
            ];
            this.renderData.textureCoords = new Float32Array(uvs);
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
            this.renderData.indices = new Uint32Array(quadVertexIndices);
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return Quad;
}(Primitive));
///<reference path='prim.ts' />
//
// sphere.ts
// UV sphere (most basic sphere mesh)
var Sphere = /** @class */ (function (_super) {
    __extends(Sphere, _super);
    function Sphere(size, position, mat, parallels, meridians) {
        if (size === void 0) { size = 1; }
        if (position === void 0) { position = gml.Vec4.origin; }
        if (mat === void 0) { mat = new BlinnPhongMaterial(); }
        if (parallels === void 0) { parallels = 15; }
        if (meridians === void 0) { meridians = 30; }
        var _this = _super.call(this) || this;
        _this.transform.scale = new gml.Vec3(size, size, size);
        _this.transform.translation = position;
        _this.material = mat;
        _this.renderData = new RenderData();
        // trigger a rebuild when the renderer updates
        _this.renderData.dirty = true;
        _this.parallels = parallels;
        _this.meridians = meridians;
        return _this;
    }
    Sphere.prototype.rebuildRenderData = function (gl) {
        var vertices = [];
        var indices = [];
        var uvs = [];
        if (this.renderData.dirty) {
            this.renderData.dirty = false;
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
                    uvs.push(Math.atan2(x, z) / (2 * Math.PI) + 0.5);
                    uvs.push(y * 0.5 + 0.5);
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
            this.renderData.normals = new Float32Array(vertices); // for a unit sphere located at 0,0,0, the normals are exactly the same as the vertices
            this.renderData.indices = new Uint32Array(indices);
            this.renderData.textureCoords = new Uint32Array(uvs);
            this.renderData.rebuildBufferObjects(gl);
        }
    };
    return Sphere;
}(Primitive));
var SHADERTYPE;
(function (SHADERTYPE) {
    SHADERTYPE[SHADERTYPE["SIMPLE_VERTEX"] = 0] = "SIMPLE_VERTEX";
    SHADERTYPE[SHADERTYPE["LAMBERT_FRAGMENT"] = 1] = "LAMBERT_FRAGMENT";
    SHADERTYPE[SHADERTYPE["BLINN_PHONG_FRAGMENT"] = 2] = "BLINN_PHONG_FRAGMENT";
    SHADERTYPE[SHADERTYPE["DEBUG_VERTEX"] = 3] = "DEBUG_VERTEX";
    SHADERTYPE[SHADERTYPE["DEBUG_FRAGMENT"] = 4] = "DEBUG_FRAGMENT";
    SHADERTYPE[SHADERTYPE["OREN_NAYAR_FRAGMENT"] = 5] = "OREN_NAYAR_FRAGMENT";
    SHADERTYPE[SHADERTYPE["COOK_TORRANCE_FRAGMENT"] = 6] = "COOK_TORRANCE_FRAGMENT";
    SHADERTYPE[SHADERTYPE["COOK_TORRANCE_FRAGMENT_NO_EXT"] = 7] = "COOK_TORRANCE_FRAGMENT_NO_EXT";
    SHADERTYPE[SHADERTYPE["UTILS"] = 8] = "UTILS";
    SHADERTYPE[SHADERTYPE["SKYBOX_VERTEX"] = 9] = "SKYBOX_VERTEX";
    SHADERTYPE[SHADERTYPE["SKYBOX_FRAG"] = 10] = "SKYBOX_FRAG";
    SHADERTYPE[SHADERTYPE["SKY_FRAG"] = 11] = "SKY_FRAG";
    SHADERTYPE[SHADERTYPE["CUBE_SH_FRAG"] = 12] = "CUBE_SH_FRAG";
    SHADERTYPE[SHADERTYPE["PASSTHROUGH_VERT"] = 13] = "PASSTHROUGH_VERT";
    SHADERTYPE[SHADERTYPE["WATER_VERT"] = 14] = "WATER_VERT";
    SHADERTYPE[SHADERTYPE["SS_QUAD_VERT"] = 15] = "SS_QUAD_VERT";
    SHADERTYPE[SHADERTYPE["WATER_FRAG"] = 16] = "WATER_FRAG";
    SHADERTYPE[SHADERTYPE["WATER_SS_FRAG"] = 17] = "WATER_SS_FRAG";
    SHADERTYPE[SHADERTYPE["NOISE_WRITER_FRAG"] = 18] = "NOISE_WRITER_FRAG";
    SHADERTYPE[SHADERTYPE["VOLUME_VIEWER_FRAG"] = 19] = "VOLUME_VIEWER_FRAG";
    SHADERTYPE[SHADERTYPE["POST_PROCESS_FRAG"] = 20] = "POST_PROCESS_FRAG";
    SHADERTYPE[SHADERTYPE["DEPTH_TEXTURE_FRAG"] = 21] = "DEPTH_TEXTURE_FRAG";
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
    SHADER_PROGRAM[SHADER_PROGRAM["SKY"] = 6] = "SKY";
    SHADER_PROGRAM[SHADER_PROGRAM["WATER"] = 7] = "WATER";
    SHADER_PROGRAM[SHADER_PROGRAM["WATER_SCREENSPACE"] = 8] = "WATER_SCREENSPACE";
    SHADER_PROGRAM[SHADER_PROGRAM["CUBE_SH"] = 9] = "CUBE_SH";
    SHADER_PROGRAM[SHADER_PROGRAM["NOISE_WRITER"] = 10] = "NOISE_WRITER";
    SHADER_PROGRAM[SHADER_PROGRAM["VOLUME_VIEWER"] = 11] = "VOLUME_VIEWER";
    SHADER_PROGRAM[SHADER_PROGRAM["POST_PROCESS"] = 12] = "POST_PROCESS";
    SHADER_PROGRAM[SHADER_PROGRAM["RENDER_DEPTH_TEXTURE"] = 13] = "RENDER_DEPTH_TEXTURE";
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
var ShaderFile = /** @class */ (function () {
    function ShaderFile(source, loaded) {
        if (source === void 0) { source = ""; }
        if (loaded === void 0) { loaded = false; }
        this.source = source;
        this.loaded = loaded;
    }
    return ShaderFile;
}());
var ShaderRepository = /** @class */ (function () {
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
        this.asyncLoadShader("lambert.frag", SHADERTYPE.LAMBERT_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("blinn-phong.frag", SHADERTYPE.BLINN_PHONG_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("debug.frag", SHADERTYPE.DEBUG_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("oren-nayar.frag", SHADERTYPE.OREN_NAYAR_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cook-torrance.frag", SHADERTYPE.COOK_TORRANCE_FRAGMENT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cook-torrance-legacy.frag", SHADERTYPE.COOK_TORRANCE_FRAGMENT_NO_EXT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("utils.frag", SHADERTYPE.UTILS, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("skybox.vert", SHADERTYPE.SKYBOX_VERTEX, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("skybox.frag", SHADERTYPE.SKYBOX_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("sky.frag", SHADERTYPE.SKY_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("cube-sh.frag", SHADERTYPE.CUBE_SH_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("passthrough.vert", SHADERTYPE.PASSTHROUGH_VERT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("water.vert", SHADERTYPE.WATER_VERT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("water.frag", SHADERTYPE.WATER_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("screenspacequad.vert", SHADERTYPE.SS_QUAD_VERT, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("water_screenspace.frag", SHADERTYPE.WATER_SS_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("noise_writer.frag", SHADERTYPE.NOISE_WRITER_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("volume_viewer.frag", SHADERTYPE.VOLUME_VIEWER_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("post-process.frag", SHADERTYPE.POST_PROCESS_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
        this.asyncLoadShader("depth-texture.frag", SHADERTYPE.DEPTH_TEXTURE_FRAG, function (stype, contents) { _this.shaderLoaded(stype, contents); });
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
}());
var ShaderSource = /** @class */ (function () {
    function ShaderSource(vs, fs) {
        this.vs = vs;
        this.fs = fs;
    }
    return ShaderSource;
}());
var ShaderMaterialProperties = /** @class */ (function () {
    function ShaderMaterialProperties() {
    }
    return ShaderMaterialProperties;
}());
var ShaderLightProperties = /** @class */ (function () {
    function ShaderLightProperties() {
    }
    return ShaderLightProperties;
}());
var ShaderUniforms = /** @class */ (function () {
    function ShaderUniforms() {
    }
    return ShaderUniforms;
}());
var ShaderProgramData = /** @class */ (function () {
    function ShaderProgramData(vert, frag) {
        this.vert = vert;
        this.frag = frag;
        this.program = null;
        this.uniforms = new ShaderUniforms();
    }
    return ShaderProgramData;
}());
var Renderer = /** @class */ (function () {
    function Renderer(viewportElement, sr, backgroundColor) {
        if (backgroundColor === void 0) { backgroundColor = new gml.Vec4(0, 0, 0, 1); }
        this.repo = sr;
        var gl = viewportElement.getContext("webgl2", { antialias: true });
        gl.viewport(0, 0, viewportElement.width, viewportElement.height);
        this.viewportW = viewportElement.width;
        this.viewportH = viewportElement.height;
        gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things
        gl.enable(gl.BLEND); // Enable blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.context = gl;
        var success = true;
        if (!this.context) {
            alert("Unable to initialize WebGL. Your browser may not support it");
            success = false;
        }
        this.shaderLODExtension = gl.getExtension("EXT_shader_texture_lod");
        this.elementIndexExtension = gl.getExtension("OES_element_index_uint");
        this.programData = [];
        // compile phong program
        var phongProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.BLINN_PHONG_FRAGMENT].source);
        if (phongProgram == null) {
            alert("Phong shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.BLINN_PHONG] = new ShaderProgramData(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.BLINN_PHONG_FRAGMENT].source);
        this.programData[SHADER_PROGRAM.BLINN_PHONG].program = phongProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.BLINN_PHONG);
        var lambertProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.LAMBERT_FRAGMENT].source);
        if (lambertProgram == null) {
            alert("Lambert shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.LAMBERT] = new ShaderProgramData(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.LAMBERT_FRAGMENT].source);
        this.programData[SHADER_PROGRAM.LAMBERT].program = lambertProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.LAMBERT);
        var debugProgram = this.compileShaderProgram(sr.files[SHADERTYPE.DEBUG_VERTEX].source, sr.files[SHADERTYPE.DEBUG_FRAGMENT].source);
        if (debugProgram == null) {
            alert("Debug shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.DEBUG] = new ShaderProgramData(sr.files[SHADERTYPE.DEBUG_VERTEX].source, sr.files[SHADERTYPE.DEBUG_FRAGMENT].source);
        this.programData[SHADER_PROGRAM.DEBUG].program = debugProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.DEBUG);
        var orenNayarProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.OREN_NAYAR_FRAGMENT].source);
        if (orenNayarProgram == null) {
            alert("Oren-Nayar shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.OREN_NAYAR] = new ShaderProgramData(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.OREN_NAYAR_FRAGMENT].source);
        this.programData[SHADER_PROGRAM.OREN_NAYAR].program = orenNayarProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.OREN_NAYAR);
        var cookTorranceProgram = null;
        if (this.shaderLODExtension != null) {
            cookTorranceProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.COOK_TORRANCE_FRAGMENT].source);
        }
        else {
            cookTorranceProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.COOK_TORRANCE_FRAGMENT_NO_EXT].source);
        }
        if (cookTorranceProgram == null) {
            alert("Cook-Torrance shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.COOK_TORRANCE] = new ShaderProgramData(sr.files[SHADERTYPE.SIMPLE_VERTEX].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.COOK_TORRANCE_FRAGMENT_NO_EXT].source);
        this.programData[SHADER_PROGRAM.COOK_TORRANCE].program = cookTorranceProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.COOK_TORRANCE);
        var skyboxProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SKYBOX_VERTEX].source, sr.files[SHADERTYPE.SKYBOX_FRAG].source);
        if (skyboxProgram == null) {
            alert("Skybox shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.SKYBOX] = new ShaderProgramData(sr.files[SHADERTYPE.SKYBOX_VERTEX].source, sr.files[SHADERTYPE.SKYBOX_FRAG].source);
        this.programData[SHADER_PROGRAM.SKYBOX].program = skyboxProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.SKYBOX);
        var skyProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SKYBOX_VERTEX].source, sr.files[SHADERTYPE.SKY_FRAG].source);
        if (skyProgram == null) {
            alert("Sky shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.SKY] = new ShaderProgramData(sr.files[SHADERTYPE.SKYBOX_VERTEX].source, sr.files[SHADERTYPE.SKY_FRAG].source);
        this.programData[SHADER_PROGRAM.SKY].program = skyProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.SKY);
        var waterProgram = this.compileShaderProgram(sr.files[SHADERTYPE.WATER_VERT].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.WATER_FRAG].source);
        if (waterProgram == null) {
            alert("Water shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.WATER] = new ShaderProgramData(sr.files[SHADERTYPE.WATER_VERT].source, sr.files[SHADERTYPE.UTILS].source + sr.files[SHADERTYPE.WATER_FRAG].source);
        this.programData[SHADER_PROGRAM.WATER].program = waterProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.WATER);
        var waterSSProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.WATER_SS_FRAG].source);
        if (waterSSProgram == null) {
            alert("Screenspace water compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.WATER_SCREENSPACE] = new ShaderProgramData(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.WATER_SS_FRAG].source);
        this.programData[SHADER_PROGRAM.WATER_SCREENSPACE].program = waterSSProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.WATER_SCREENSPACE);
        var noiseWriterProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.NOISE_WRITER_FRAG].source);
        if (noiseWriterProgram == null) {
            alert("Noise writer compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.NOISE_WRITER] = new ShaderProgramData(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.NOISE_WRITER_FRAG].source);
        this.programData[SHADER_PROGRAM.NOISE_WRITER].program = noiseWriterProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.NOISE_WRITER);
        var volumeViewerProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.VOLUME_VIEWER_FRAG].source);
        if (volumeViewerProgram == null) {
            alert("Volume viewer compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.VOLUME_VIEWER] = new ShaderProgramData(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.VOLUME_VIEWER_FRAG].source);
        this.programData[SHADER_PROGRAM.VOLUME_VIEWER].program = volumeViewerProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.VOLUME_VIEWER);
        var postProcessProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.POST_PROCESS_FRAG].source);
        if (postProcessProgram == null) {
            alert("post process compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.POST_PROCESS] = new ShaderProgramData(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.POST_PROCESS_FRAG].source);
        this.programData[SHADER_PROGRAM.POST_PROCESS].program = postProcessProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.POST_PROCESS);
        var depthTextureProgram = this.compileShaderProgram(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.DEPTH_TEXTURE_FRAG].source);
        if (depthTextureProgram == null) {
            alert("depth texture compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.RENDER_DEPTH_TEXTURE] = new ShaderProgramData(sr.files[SHADERTYPE.SS_QUAD_VERT].source, sr.files[SHADERTYPE.DEPTH_TEXTURE_FRAG].source);
        this.programData[SHADER_PROGRAM.RENDER_DEPTH_TEXTURE].program = depthTextureProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.RENDER_DEPTH_TEXTURE);
        var cubeMapSHProgram = this.compileShaderProgram(sr.files[SHADERTYPE.PASSTHROUGH_VERT].source, sr.files[SHADERTYPE.CUBE_SH_FRAG].source);
        if (cubeMapSHProgram == null) {
            alert("Cube map shader compilation failed. Please check the log for details.");
            success = false;
        }
        this.programData[SHADER_PROGRAM.CUBE_SH] = new ShaderProgramData(sr.files[SHADERTYPE.PASSTHROUGH_VERT].source, sr.files[SHADERTYPE.CUBE_SH_FRAG].source);
        this.programData[SHADER_PROGRAM.CUBE_SH].program = cubeMapSHProgram;
        this.cacheLitShaderProgramLocations(SHADER_PROGRAM.CUBE_SH);
        this.visualizeDepthBuffer = false;
        {
            /*
            this.envMapSHTexture = gl.createTexture();
            gl.bindTexture( gl.TEXTURE_2D, this.envMapSHTexture );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 8, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
      
            let sb = gl.createRenderbuffer();
            gl.bindRenderbuffer( gl.RENDERBUFFER, sb );
            gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 8, 1 );
      
            this.envMapSHFrameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer( gl.FRAMEBUFFER, this.envMapSHFrameBuffer );
            gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.envMapSHTexture, 0 );
            gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sb );
            */
        }
        this.fullscreenQuad = new Quad();
        this.fullscreenQuad.rebuildRenderData(gl);
        this.postProcessColorTexture = gl.createTexture();
        this.postProcessDepthTexture = gl.createTexture();
        this.postProcessFramebuffer = gl.createFramebuffer();
    }
    Renderer.prototype.cacheLitShaderProgramLocations = function (sp) {
        var gl = this.context;
        var program = this.programData[sp].program;
        var uniforms = this.programData[sp].uniforms;
        uniforms.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.enableVertexAttribArray(uniforms.aVertexPosition);
        uniforms.aMeshCoord = gl.getAttribLocation(program, "aMeshCoord");
        if (uniforms.aMeshCoord >= 0) {
            gl.enableVertexAttribArray(uniforms.aMeshCoord);
        }
        uniforms.aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
        if (uniforms.aVertexNormal >= 0) {
            gl.enableVertexAttribArray(uniforms.aVertexNormal);
        }
        uniforms.aVertexTexCoord = gl.getAttribLocation(program, "aVertexTexCoord");
        if (uniforms.aVertexTexCoord >= 0) {
            gl.enableVertexAttribArray(uniforms.aVertexTexCoord);
        }
        uniforms.uModelView = gl.getUniformLocation(program, "uMVMatrix");
        uniforms.uView = gl.getUniformLocation(program, "uVMatrix");
        uniforms.uModelToWorld = gl.getUniformLocation(program, "uMMatrix");
        uniforms.uPerspective = gl.getUniformLocation(program, "uPMatrix");
        uniforms.uNormalModelView = gl.getUniformLocation(program, "uNormalMVMatrix");
        uniforms.uNormalWorld = gl.getUniformLocation(program, "uNormalWorldMatrix");
        uniforms.uInverseProjection = gl.getUniformLocation(program, "uInverseProjectionMatrix");
        uniforms.uInverseView = gl.getUniformLocation(program, "uInverseViewMatrix");
        uniforms.uCameraPos = gl.getUniformLocation(program, "cPosition_World");
        uniforms.uEnvMap = gl.getUniformLocation(program, "environment");
        uniforms.uVolume = gl.getUniformLocation(program, "volume");
        uniforms.uWireframe = gl.getUniformLocation(program, "uDrawWireframe");
        uniforms.uProcSky = gl.getUniformLocation(program, "proceduralSky");
        uniforms.uIrradianceMap = gl.getUniformLocation(program, "irradiance");
        uniforms.uTime = gl.getUniformLocation(program, "uTime");
        uniforms.uCloudiness = gl.getUniformLocation(program, "uCloudiness");
        uniforms.uCloudSpeed = gl.getUniformLocation(program, "uCloudSpeed");
        uniforms.uNoiseLayer = gl.getUniformLocation(program, "uNoiseLayer");
        uniforms.uCombinedNoiseVolume = gl.getUniformLocation(program, "uCombinedNoiseVolume");
        uniforms.uColor = gl.getUniformLocation(program, "screen_color");
        uniforms.uDepth = gl.getUniformLocation(program, "screen_depth");
        uniforms.uFocus = gl.getUniformLocation(program, "focus");
        uniforms.uMaterial = new ShaderMaterialProperties();
        uniforms.uMaterial.ambient = gl.getUniformLocation(program, "mat.ambient");
        uniforms.uMaterial.diffuse = gl.getUniformLocation(program, "mat.diffuse");
        uniforms.uMaterial.specular = gl.getUniformLocation(program, "mat.specular");
        uniforms.uMaterial.emissive = gl.getUniformLocation(program, "mat.emissive");
        uniforms.uMaterial.shininess = gl.getUniformLocation(program, "mat.shininess");
        uniforms.uMaterial.roughness = gl.getUniformLocation(program, "mat.roughness");
        uniforms.uMaterial.fresnel = gl.getUniformLocation(program, "mat.fresnel");
        uniforms.uMaterial.colorMap = gl.getUniformLocation(program, "mat.colormap");
        uniforms.uLights = [];
        for (var i = 0; i < 10; i++) {
            uniforms.uLights[i] = new ShaderLightProperties();
            uniforms.uLights[i].position = gl.getUniformLocation(program, "lights[" + i + "].position");
            uniforms.uLights[i].color = gl.getUniformLocation(program, "lights[" + i + "].color");
            uniforms.uLights[i].enabled = gl.getUniformLocation(program, "lights[" + i + "].enabled");
            uniforms.uLights[i].radius = gl.getUniformLocation(program, "lights[" + i + "].radius");
        }
    };
    Renderer.prototype.compileShaderProgram = function (vs, fs, suppressErrors) {
        if (suppressErrors === void 0) { suppressErrors = false; }
        var gl = this.context;
        if (gl) {
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vs);
            gl.compileShader(vertexShader);
            if (!suppressErrors && !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.log("An error occurred compiling the vertex shader: " + gl.getShaderInfoLog(vertexShader));
                return null;
            }
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fs);
            gl.compileShader(fragmentShader);
            if (!suppressErrors && !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
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
                console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
                console.log("Problematic vertex shader:\n" + vs);
                console.log("Problematic fragment shader:\n" + fs);
            }
            return program;
        }
        return null;
    };
    Renderer.prototype.update = function () {
        var gl = this.context;
        var scene = Scene.getActiveScene();
        if (scene) {
            scene.renderables.forEach(function (p) {
                if (p.renderData.dirty) {
                    p.rebuildRenderData(gl);
                }
            });
        }
    };
    Renderer.prototype.renderSceneSkybox = function (gl, scene, mvStack, viewportW, viewportH, perspective) {
        if (perspective === void 0) { perspective = null; }
        if (perspective == null) {
            perspective = gml.makePerspective(gml.fromDegrees(45), viewportW / viewportH, 0.1, 1000.0);
        }
        if (scene.environmentMap != null) {
            this.useProgram(gl, SHADER_PROGRAM.SKYBOX);
        }
        else {
            this.useProgram(gl, SHADER_PROGRAM.SKY); // this shader program automatically moves our quad near the far clip plane, so we don't need to transform it ourselves here
        }
        var shaderVariables = this.programData[this.currentProgram].uniforms;
        var inverseProjectionMatrix = perspective.invert();
        gl.uniformMatrix4fv(shaderVariables.uInverseProjection, false, inverseProjectionMatrix.m);
        var inverseViewMatrix = mvStack[mvStack.length - 1].invert().mat3;
        gl.uniformMatrix3fv(shaderVariables.uInverseView, false, inverseViewMatrix.m);
        gl.uniformMatrix4fv(shaderVariables.uModelToWorld, false, this.fullscreenQuad.transform.m);
        if (this.camera != null) {
            gl.uniform4fv(shaderVariables.uCameraPos, this.camera.matrix.translation.negate().v);
        }
        gl.uniform1f(shaderVariables.uTime, scene.time);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreenQuad.renderData.indexBuffer);
        if (this.currentProgram == SHADER_PROGRAM.SKYBOX) {
            gl.uniform1i(shaderVariables.uEnvMap, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environmentMap.cubeMapTexture);
        }
        gl.drawElements(gl.TRIANGLES, this.fullscreenQuad.renderData.indices.length, gl.UNSIGNED_INT, 0);
    };
    Renderer.prototype.renderDepthBuffer = function (gl, depth, mvStack) {
        this.useProgram(gl, SHADER_PROGRAM.RENDER_DEPTH_TEXTURE);
        var shaderVariables = this.programData[this.currentProgram].uniforms;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreenQuad.renderData.indexBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexTexCoordBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderVariables.uView, false, mvStack[mvStack.length - 1].m);
        gl.uniform1i(shaderVariables.uDepth, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depth);
        gl.drawElements(gl.TRIANGLES, this.fullscreenQuad.renderData.indices.length, gl.UNSIGNED_INT, 0);
    };
    Renderer.prototype.renderPostProcessedImage = function (gl, color, depth, mvStack) {
        this.useProgram(gl, SHADER_PROGRAM.POST_PROCESS);
        var shaderVariables = this.programData[this.currentProgram].uniforms;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreenQuad.renderData.indexBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexTexCoordBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(shaderVariables.uView, false, mvStack[mvStack.length - 1].m);
        gl.uniform1i(shaderVariables.uColor, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, color);
        gl.uniform1i(shaderVariables.uDepth, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depth);
        if (this.camera != null) {
            gl.uniform1f(shaderVariables.uFocus, this.camera.focalDistance);
        }
        gl.drawElements(gl.TRIANGLES, this.fullscreenQuad.renderData.indices.length, gl.UNSIGNED_INT, 0);
    };
    Renderer.prototype.renderScene = function (gl, scene, mvStack, pass) {
        var _this = this;
        var perspective = gml.makePerspective(gml.fromDegrees(45), this.viewportW / this.viewportH, 0.1, 1000.0);
        scene.renderables.forEach(function (p, i) {
            if (p.material instanceof BlinnPhongMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.BLINN_PHONG);
                var blinnphong = p.material;
                var shaderVariables_1 = _this.programData[SHADER_PROGRAM.BLINN_PHONG].uniforms;
                gl.uniform4fv(shaderVariables_1.uMaterial.diffuse, blinnphong.diffuse.v);
                gl.uniform4fv(shaderVariables_1.uMaterial.ambient, blinnphong.ambient.v);
                gl.uniform4fv(shaderVariables_1.uMaterial.specular, blinnphong.specular.v);
                gl.uniform4fv(shaderVariables_1.uMaterial.emissive, blinnphong.emissive.v);
                gl.uniform1f(shaderVariables_1.uMaterial.shininess, blinnphong.shininess);
            }
            else if (p.material instanceof DebugMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.DEBUG);
            }
            else if (p.material instanceof OrenNayarMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.OREN_NAYAR);
                var orennayar = p.material;
                var shaderVariables_2 = _this.programData[SHADER_PROGRAM.OREN_NAYAR].uniforms;
                gl.uniform4fv(shaderVariables_2.uMaterial.diffuse, orennayar.diffuse.v);
                gl.uniform1f(shaderVariables_2.uMaterial.roughness, orennayar.roughness);
            }
            else if (p.material instanceof LambertMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.LAMBERT);
                var lambert = p.material;
                var shaderVariables_3 = _this.programData[SHADER_PROGRAM.LAMBERT].uniforms;
                gl.uniform4fv(shaderVariables_3.uMaterial.diffuse, lambert.diffuse.v);
            }
            else if (p.material instanceof CookTorranceMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.COOK_TORRANCE);
                var cooktorrance = p.material;
                var shaderVariables_4 = _this.programData[SHADER_PROGRAM.COOK_TORRANCE].uniforms;
                gl.uniform4fv(shaderVariables_4.uMaterial.diffuse, cooktorrance.diffuse.v);
                gl.uniform4fv(shaderVariables_4.uMaterial.specular, cooktorrance.specular.v);
                gl.uniform1f(shaderVariables_4.uMaterial.roughness, cooktorrance.roughness);
                gl.uniform1f(shaderVariables_4.uMaterial.fresnel, cooktorrance.fresnel);
            }
            else if (p.material instanceof WaterMaterial) {
                if (p.material.screenspace) {
                    _this.useProgram(gl, SHADER_PROGRAM.WATER_SCREENSPACE);
                    var shaderVariables_5 = _this.programData[_this.currentProgram].uniforms;
                    gl.uniform1f(shaderVariables_5.uTime, scene.time);
                    gl.uniform1f(shaderVariables_5.uCloudiness, scene.cloudiness);
                    var inverseProjectionMatrix = perspective.invert();
                    gl.uniformMatrix4fv(shaderVariables_5.uInverseProjection, false, inverseProjectionMatrix.m);
                }
                else {
                    _this.useProgram(gl, SHADER_PROGRAM.WATER);
                    var shaderVariables_6 = _this.programData[_this.currentProgram].uniforms;
                    gl.uniform1f(shaderVariables_6.uTime, scene.time);
                    gl.uniform1f(shaderVariables_6.uCloudiness, scene.cloudiness);
                    gl.uniform1f(shaderVariables_6.uCloudSpeed, scene.cloudSpeed);
                    gl.uniform1i(shaderVariables_6.uWireframe, p.material.wireframe ? 1 : 0);
                }
            }
            else if (p.material instanceof NoiseMaterial) {
                _this.useProgram(gl, SHADER_PROGRAM.NOISE_WRITER);
                var shaderVariables_7 = _this.programData[_this.currentProgram].uniforms;
                gl.uniform1f(shaderVariables_7.uNoiseLayer, p.material.layer);
            }
            else if (p.material instanceof VolumeMaterial) {
                var mat = p.material;
                _this.useProgram(gl, SHADER_PROGRAM.VOLUME_VIEWER);
                var shaderVariables_8 = _this.programData[_this.currentProgram].uniforms;
                gl.uniform1f(shaderVariables_8.uNoiseLayer, mat.layer);
                if (mat.volumeTexture != null) {
                    gl.uniform1i(shaderVariables_8.uVolume, 0);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_3D, mat.volumeTexture);
                }
            }
            var shaderVariables = _this.programData[_this.currentProgram].uniforms;
            scene.lights.forEach(function (l, i) {
                var lightpos = mvStack[mvStack.length - 1].transform(l.position);
                gl.uniform4fv(shaderVariables.uLights[i].position, lightpos.v);
                gl.uniform4fv(shaderVariables.uLights[i].color, l.color.v);
                gl.uniform1i(shaderVariables.uLights[i].enabled, l.enabled ? 1 : 0);
                gl.uniform1f(shaderVariables.uLights[i].radius, l.radius);
            });
            gl.uniformMatrix4fv(shaderVariables.uPerspective, false, perspective.m);
            if (_this.camera != null) {
                gl.uniform4fv(shaderVariables.uCameraPos, _this.camera.matrix.translation.v);
            }
            var primitiveModelView = mvStack[mvStack.length - 1].multiply(p.transform);
            gl.uniformMatrix4fv(shaderVariables.uModelView, false, primitiveModelView.m);
            gl.uniformMatrix4fv(shaderVariables.uModelToWorld, false, p.transform.m);
            gl.uniformMatrix4fv(shaderVariables.uView, false, mvStack[mvStack.length - 1].m);
            // the normal matrix is defined as the upper 3x3 block of transpose( inverse( model-view ) )
            var normalMVMatrix = primitiveModelView.invert().transpose().mat3;
            gl.uniformMatrix3fv(shaderVariables.uNormalModelView, false, normalMVMatrix.m);
            var normalWorldMatrix = p.transform.invert().transpose().mat3;
            gl.uniformMatrix3fv(shaderVariables.uNormalWorld, false, normalWorldMatrix.m);
            var inverseViewMatrix = mvStack[mvStack.length - 1].invert().mat3;
            gl.uniformMatrix3fv(shaderVariables.uInverseView, false, inverseViewMatrix.m);
            gl.bindBuffer(gl.ARRAY_BUFFER, p.renderData.vertexBuffer);
            gl.vertexAttribPointer(shaderVariables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            if (shaderVariables.aMeshCoord >= 0 && p.renderData.meshCoordsBuffer != null) {
                gl.bindBuffer(gl.ARRAY_BUFFER, p.renderData.meshCoordsBuffer);
                gl.vertexAttribPointer(shaderVariables.aMeshCoord, 2, gl.FLOAT, false, 0, 0);
            }
            if (shaderVariables.aVertexTexCoord >= 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, p.renderData.vertexTexCoordBuffer);
                gl.vertexAttribPointer(shaderVariables.aVertexTexCoord, 2, gl.FLOAT, false, 0, 0);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, p.renderData.vertexNormalBuffer);
            if (shaderVariables.aVertexNormal >= 0) {
                gl.vertexAttribPointer(shaderVariables.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.renderData.indexBuffer);
            if (scene.environmentMap != null) {
                gl.uniform1i(shaderVariables.uEnvMap, 0); // tells shader to refer to texture slot 1 for the uEnvMap uniform
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environmentMap.cubeMapTexture);
            }
            if (scene.irradianceMap != null) {
                gl.uniform1i(shaderVariables.uIrradianceMap, 1); // tells shader to look at texture slot 1 for the uEnvMap uniform
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.irradianceMap.cubeMapTexture);
            }
            gl.drawElements(gl.TRIANGLES, p.renderData.indices.length, gl.UNSIGNED_INT, 0);
        });
    };
    Renderer.prototype.useProgram = function (gl, program) {
        gl.useProgram(this.programData[program].program);
        var shaderVariables = this.programData[program].uniforms;
        gl.disableVertexAttribArray(0);
        gl.disableVertexAttribArray(1);
        gl.disableVertexAttribArray(2);
        if (shaderVariables.aVertexPosition >= 0) {
            gl.enableVertexAttribArray(shaderVariables.aVertexPosition);
        }
        if (shaderVariables.aVertexNormal >= 0) {
            gl.enableVertexAttribArray(shaderVariables.aVertexNormal);
        }
        if (shaderVariables.aVertexTexCoord >= 0) {
            gl.enableVertexAttribArray(shaderVariables.aVertexTexCoord);
        }
        if (shaderVariables.aMeshCoord >= 0) {
            gl.enableVertexAttribArray(shaderVariables.aMeshCoord);
        }
        this.currentProgram = program;
    };
    Renderer.prototype.renderIrradianceFromScene = function (gl, scene, pass) {
        this.useProgram(gl, SHADER_PROGRAM.CUBE_SH);
        var shaderVariables = this.programData[this.currentProgram].uniforms;
        gl.uniformMatrix4fv(shaderVariables.uModelView, false, gml.Mat4.identity().m);
        gl.uniformMatrix3fv(shaderVariables.uNormalModelView, false, gml.Mat3.identity().m);
        gl.uniformMatrix4fv(shaderVariables.uPerspective, false, gml.Mat4.identity().m);
        if (scene.environmentMap != null) {
            gl.uniform1i(shaderVariables.uEnvMap, 0); // tells GL to look at texture slot 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environmentMap.cubeMapTexture);
        }
        gl.drawElements(gl.TRIANGLES, this.fullscreenQuad.renderData.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    Renderer.prototype.renderFullScreenTexture = function (gl, texture) {
        // this.useProgram( gl, SHADER_PROGRAM.UNLIT );
        var shaderVariables = this.programData[this.currentProgram].uniforms;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexBuffer);
        gl.vertexAttribPointer(shaderVariables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.fullscreenQuad.renderData.textureCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderVariables.aVertexTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreenQuad.renderData.indexBuffer);
        gl.uniform1i(shaderVariables.uMaterial.colorMap, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawElements(gl.TRIANGLES, this.fullscreenQuad.renderData.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    Renderer.prototype.renderIrradiance = function () {
        var gl = this.context;
        if (gl) {
            var scene = Scene.getActiveScene();
            if (scene) {
                // SET UP ENVIRONMENT MAP
                var cubeMapTexture = null;
                if (scene.environmentMap != null && scene.environmentMap.loaded && scene.environmentMap.cubeMapTexture == null) {
                    scene.environmentMap.generateCubeMapFromSources(gl);
                }
                //
                // COMPUTE SH COEFFICIENTS
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.envMapSHFrameBuffer);
                gl.viewport(0, 0, 8, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
                this.renderIrradianceFromScene(gl, scene, IRRADIANCE_PASS.SH_COMPUTE);
                //
                // (DEBUG) SHOW SH IN SCENE
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, this.viewportW, this.viewportH);
                gl.clear(gl.COLOR_BUFFER_BIT);
                this.renderFullScreenTexture(gl, this.envMapSHTexture);
            }
        }
    };
    Renderer.prototype.render = function () {
        var gl = this.context;
        if (gl) {
            //
            // DRAW
            var scene = Scene.getActiveScene();
            if (scene) {
                // 
                // GENERATE ENVIRONMENT MAP, IF NECESSARY
                if (scene.hasEnvironment) {
                    if (this.enableTracing)
                        console.time("environment map");
                    if (scene.dynamicEnvironment) {
                        // render using specified shader
                        // TODO: actually pass in shader into scene
                        scene.generateEnvironmentMapFromShader(this, gl, this.programData[SHADER_PROGRAM.SKY].program, this.programData[SHADER_PROGRAM.SKY].uniforms);
                    }
                    else if (scene.environmentMap.loaded && scene.environmentMap.cubeMapTexture == null) {
                        // generate static cube map from face images - we only do this once
                        scene.environmentMap.generateCubeMapFromSources(gl);
                    }
                    if (this.enableTracing)
                        console.timeEnd("environment map");
                }
                //
                // SET UP IRRADIANCE MAP
                // TODO implement
                var irradianceTexture = null;
                if (scene.irradianceMap != null && scene.irradianceMap.loaded && scene.irradianceMap.cubeMapTexture == null) {
                    scene.irradianceMap.generateCubeMapFromSources(gl);
                }
                var mvStack = [];
                if (this.camera != null) {
                    // THIS MIGHT BE WRONG...maybe we're not negating the z???
                    mvStack.push(this.camera.matrix);
                }
                else {
                    mvStack.push(gml.Mat4.identity());
                }
                //
                // RENDER TO POST-PROCESS FRAMEBUFFER
                //
                gl.bindTexture(gl.TEXTURE_2D, this.postProcessColorTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.viewportW, this.viewportH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.bindTexture(gl.TEXTURE_2D, this.postProcessDepthTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, this.viewportW, this.viewportH, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.postProcessFramebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.postProcessColorTexture, 0);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.postProcessDepthTexture, 0);
                gl.viewport(0, 0, this.viewportW, this.viewportH);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                // draw environment map
                if (scene.hasEnvironment) {
                    if (this.enableTracing)
                        console.time("environment");
                    this.renderSceneSkybox(gl, scene, mvStack, this.viewportW, this.viewportH);
                    if (this.enableTracing)
                        console.timeEnd("environment");
                }
                // draw scene
                if (this.enableTracing)
                    console.time("render scene");
                this.renderScene(gl, scene, mvStack, PASS.STANDARD_FORWARD);
                if (this.enableTracing)
                    console.timeEnd("render scene");
                // 
                // RENDER POST-PROCESSED IMAGE TO SCREEN
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, this.viewportW, this.viewportH);
                // for debugging, coppy depth texture...
                if (this.visualizeDepthBuffer) {
                    if (this.enableTracing)
                        console.time("render depth buffer");
                    this.renderDepthBuffer(gl, this.postProcessDepthTexture, mvStack);
                    if (this.enableTracing)
                        console.timeEnd("render depth buffer");
                }
                else {
                    if (this.enableTracing)
                        console.time("post processing");
                    this.renderPostProcessedImage(gl, this.postProcessColorTexture, this.postProcessDepthTexture, mvStack);
                    if (this.enableTracing)
                        console.timeEnd("post processing");
                }
            }
        }
    };
    Renderer.prototype.setCamera = function (camera) {
        this.camera = camera;
    };
    return Renderer;
}());
;
//
// light.ts
// user editable light base interface
var Light = /** @class */ (function () {
    function Light() {
        this.position = new gml.Vec4(0, 0, 0, 1);
        this.enabled = true;
        this.color = new gml.Vec4(1, 1, 1, 1);
        this.radius = 1;
    }
    return Light;
}());
var PointLight = /** @class */ (function (_super) {
    __extends(PointLight, _super);
    function PointLight(position, color, radius) {
        if (radius === void 0) { radius = 1; }
        var _this = _super.call(this) || this;
        _this.position = position;
        _this.color = color;
        _this.radius = radius;
        return _this;
    }
    return PointLight;
}(Light));
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
// the cube map should be responsible for constructing from source
// or being injected one via cubeMapTexture (rendered externally)
var CubeMap = /** @class */ (function () {
    function CubeMap() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args.length == 2) {
            this.cubeMapTexture = args[0];
            this.dynamic = args[1];
            // we're generating a cube map from a shader, at constructor time
            // This should just take in a cubeMapTexture
        }
        else if (args.length == 8) {
            // we're generating a cube map from an array of 6 images
            var px = args[0];
            var nx = args[1];
            var py = args[2];
            var ny = args[3];
            var pz = args[4];
            var nz = args[5];
            var finishedLoading = args[6];
            var dynamic = args[7];
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
            this.dynamic = dynamic;
        }
    }
    CubeMap.prototype.generateCubeMapFromSources = function (gl) {
        this.cubeMapTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMapTexture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, this.faces[CUBEMAPTYPE.POS_X]);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, this.faces[CUBEMAPTYPE.NEG_X]);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, this.faces[CUBEMAPTYPE.POS_Y]);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, this.faces[CUBEMAPTYPE.NEG_Y]);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, this.faces[CUBEMAPTYPE.POS_Z]);
        this.bindCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, this.faces[CUBEMAPTYPE.NEG_Z]);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    };
    CubeMap.prototype.bindCubeMapFace = function (gl, face, image) {
        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };
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
}());
var Scene = /** @class */ (function () {
    function Scene(environmentMap, irradianceMap, hasEnvironment, dynamicEnvironment, noiseVolume) {
        if (hasEnvironment === void 0) { hasEnvironment = false; }
        if (dynamicEnvironment === void 0) { dynamicEnvironment = false; }
        if (noiseVolume === void 0) { noiseVolume = null; }
        this.renderables = [];
        this.lights = [];
        this.environmentMap = environmentMap;
        this.irradianceMap = irradianceMap;
        this.time = 0;
        this.hasEnvironment = hasEnvironment || this.environmentMap != null;
        this.dynamicEnvironment = dynamicEnvironment;
        this.noiseVolume = noiseVolume;
        this.cloudiness = 0.25;
        this.cloudSpeed = 2.3;
    }
    Scene.prototype.addRenderable = function (renderable) {
        this.renderables.push(renderable);
    };
    Scene.prototype.addLight = function (light) {
        this.lights.push(light);
    };
    Scene.prototype.generateEnvironmentMapFromShader = function (renderer, gl, shader, variables) {
        var renderTargetFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);
        var size = 256; // this is the pixel size of each side of the cube map
        // 
        // RENDER TO TEXTURE
        var depthBuffer = gl.createRenderbuffer(); // renderbuffer for depth buffer in framebuffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // so we can create storage for the depthBuffer
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        // this is the texture we'll render each face of the cube map into
        // as we render each face of the cubemap into it, we'll bind it to the actual cubemap
        var cubeMapRenderTarget = null;
        if (this.environmentMap == null || this.environmentMap.cubeMapTexture == null) {
            cubeMapRenderTarget = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapRenderTarget);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }
        else {
            cubeMapRenderTarget = this.environmentMap.cubeMapTexture;
        }
        var cameraPos = gml.Vec4.origin;
        // draw +x view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeMapRenderTarget, 0);
        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var perspective = gml.makePerspective(gml.fromDegrees(90), 1, 0.1, 100.0);
        var rightView = new gml.Mat4(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, rightView, size, size, perspective, cameraPos);
        // draw -x view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeMapRenderTarget, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var leftView = new gml.Mat4(0, 0, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, leftView, size, size, perspective, cameraPos);
        // draw +y view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeMapRenderTarget, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var upView = new gml.Mat4(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, upView, size, size, perspective, cameraPos);
        // draw -y view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeMapRenderTarget, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var downView = new gml.Mat4(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, downView, size, size, perspective, cameraPos);
        // draw +z view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeMapRenderTarget, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var frontView = new gml.Mat4(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, frontView, size, size, perspective, cameraPos);
        // draw -z view
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeMapRenderTarget, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var backView = new gml.Mat4(-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        this.renderFace(renderer, gl, shader, variables, cubeMapRenderTarget, backView, size, size, perspective, cameraPos);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapRenderTarget);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        if (this.environmentMap == null) {
            this.environmentMap = new CubeMap(cubeMapRenderTarget, true);
        }
        else {
            this.environmentMap.cubeMapTexture = cubeMapRenderTarget;
            this.environmentMap.dynamic = true;
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    };
    Scene.prototype.renderFace = function (renderer, gl, shader, variables, cubeMapRT, modelView, viewportW, viewportH, perspective, cameraPos) {
        renderer.useProgram(gl, SHADER_PROGRAM.SKY);
        if (this.fullscreen == null) {
            this.fullscreen = new Quad();
            this.fullscreen.rebuildRenderData(gl);
        }
        var inverseProjectionMatrix = perspective.invert();
        gl.uniformMatrix4fv(variables.uInverseProjection, false, inverseProjectionMatrix.m);
        var inverseViewMatrix = modelView.invert().mat3;
        gl.uniformMatrix3fv(variables.uInverseView, false, inverseViewMatrix.m);
        gl.uniform4fv(variables.uCameraPos, cameraPos.v);
        gl.uniform1f(variables.uTime, this.time);
        gl.uniform1f(variables.uCloudiness, this.cloudiness);
        gl.uniform1f(variables.uCloudSpeed, this.cloudSpeed);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreen.renderData.vertexBuffer);
        gl.vertexAttribPointer(variables.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullscreen.renderData.indexBuffer);
        gl.uniform1i(variables.uEnvMap, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapRT);
        if (this.noiseVolume != null) {
            gl.uniform1i(variables.uCombinedNoiseVolume, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this.noiseVolume);
        }
        gl.drawElements(gl.TRIANGLES, this.fullscreen.renderData.indices.length, gl.UNSIGNED_INT, 0);
    };
    Scene.setActiveScene = function (scene) {
        this.activeScene = scene;
    };
    Scene.getActiveScene = function () {
        return this.activeScene;
    };
    return Scene;
}());
var Debugger = /** @class */ (function () {
    function Debugger(renderer) {
        var _this = this;
        this.renderer = renderer;
        this.allOptions = document.createElement("div");
        this.allOptions.setAttribute("class", "options-container");
        this.depthBufferOption = document.createElement("div");
        this.depthBufferOption.setAttribute("class", "option");
        var depthBufferLabel = document.createElement("label");
        depthBufferLabel.innerText = "Depth Buffer";
        this.depthBufferOption.appendChild(depthBufferLabel);
        var depthBufferCheckbox = document.createElement("input");
        depthBufferCheckbox.setAttribute("id", "visualize-depth-buffer");
        depthBufferCheckbox.setAttribute("type", "checkbox");
        depthBufferCheckbox.onchange = function (e) { _this.depthBufferCheckboxChanged(e); };
        this.depthBufferOption.appendChild(depthBufferCheckbox);
        this.allOptions.appendChild(this.depthBufferOption);
    }
    Debugger.prototype.depthBufferCheckboxChanged = function (e) {
        this.renderer.visualizeDepthBuffer = e.target.checked;
    };
    Debugger.prototype.install = function () {
        var container = document.getElementById("debugger");
        container.appendChild(this.allOptions);
    };
    return Debugger;
}());
var verbose_editor_logging = false;
var ShaderEditor = /** @class */ (function () {
    function ShaderEditor(renderer) {
        this.renderer = renderer;
        // shader list selector
        this.shaderList = document.createElement("ul");
        this.shaderList.setAttribute("class", "shader-list");
        this.selectedShader = null;
        // vert/frag shader textbox
        this.vertexEditorField = document.createElement("div");
        this.vertexEditorField.setAttribute("class", "shader-text");
        this.fragmentEditorField = document.createElement("div");
        this.fragmentEditorField.setAttribute("class", "shader-text");
        this.shaderEditor = document.createElement("div");
        this.shaderEditor.setAttribute("class", "shader-text-con");
        this.shaderEditor.appendChild(this.vertexEditorField);
        this.shaderEditor.appendChild(this.fragmentEditorField);
        this.vertexShaderEditor = ace.edit(this.vertexEditorField);
        this.vertexShaderEditor.setTheme("ace/theme/solarized_light");
        this.vertexShaderEditor.session.setMode("ace/mode/glsl");
        this.vertexShaderEditor.$blockScrolling = Infinity;
        this.fragmentShaderEditor = ace.edit(this.fragmentEditorField);
        this.fragmentShaderEditor.setTheme("ace/theme/solarized_light");
        this.fragmentShaderEditor.session.setMode("ace/mode/glsl");
        this.fragmentShaderEditor.$blockScrolling = Infinity;
        this.hiddenShaders = [];
        // create stylesheet dynamically
        // this should probably just be put in a CSS file somewhere so it's overrideable
        // but for now, since we really don't care about customizability of the editor, just
        // put it all here for portability and ease of building
        var stylesheet = document.styleSheets[0];
        if (stylesheet == null) {
            var style = document.createElement("style");
            style.type = "text/css";
            document.getElementsByTagName("head")[0].appendChild(style);
            stylesheet = document.styleSheets[0];
        }
        stylesheet.insertRule("html, body       { height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; }");
        stylesheet.insertRule(".shader-list     { float:left; list-style-type:none; margin:0; padding-left:0; width: 200px; }");
        stylesheet.insertRule(".shader-entry    { border-bottom: 1px #ccc solid; font-size: 70%; padding-left: 10%; padding-top: 3%; padding-bottom: 3%; cursor: default; }");
        stylesheet.insertRule(".selected        { background-color: #0079e8; color: #fff }");
        stylesheet.insertRule(".shader-text     { border-left: 1px #ccc solid; width: 50%; height: 100%; margin: 0; padding: 0; }");
        stylesheet.insertRule(".shader-text-con { float: left; flex-grow: 1; display: flex; }");
    }
    ShaderEditor.prototype.hideShader = function (program) {
        this.hiddenShaders.push(program);
    };
    ShaderEditor.prototype.rebuildSelectedShader = function (session) {
        console.assert(session == this.vertexShaderEditor.session || session == this.fragmentShaderEditor.assertion);
        var gl = this.renderer.context;
        if (gl) {
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, this.vertexShaderEditor.getValue());
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                var errors = gl.getShaderInfoLog(vertexShader).split("\n");
                var annotations = [];
                for (var i = 0; i < errors.length; i++) {
                    var error = errors[i];
                    var results = /\w+: [0-9]+:([0-9]+): (.*)$/g.exec(error); // group 1: line number, group 2: error message
                    if (results == null)
                        continue;
                    // see https://regexr.com/3k19s
                    annotations.push({ row: parseInt(results[1]) - 1, column: 0, text: results[2], type: "error" });
                }
                this.vertexShaderEditor.session.clearAnnotations();
                this.vertexShaderEditor.session.setAnnotations(annotations);
                if (verbose_editor_logging) {
                    console.log(errors);
                }
                return;
            }
            else {
                // all good.
                this.vertexShaderEditor.session.clearAnnotations();
            }
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, this.fragmentShaderEditor.getValue());
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                var errors = gl.getShaderInfoLog(fragmentShader).split("\n");
                var annotations = [];
                for (var i = 0; i < errors.length; i++) {
                    var error = errors[i];
                    var results = /\w+: [0-9]+:([0-9]+): (.*)$/g.exec(error); // group 1: line number, group 2: error message
                    if (results == null)
                        continue;
                    // see https://regexr.com/3k19s
                    annotations.push({ row: parseInt(results[1]) - 1, column: 0, text: results[2], type: "error" });
                }
                this.fragmentShaderEditor.session.clearAnnotations();
                this.fragmentShaderEditor.session.setAnnotations(annotations);
                if (verbose_editor_logging) {
                    console.log(errors);
                }
                return;
            }
            else {
                // all good.
                this.fragmentShaderEditor.session.clearAnnotations();
            }
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            // force aVertexPosition to be bound to 0 to avoid perf penalty
            // gl.bindAttribLocation( program, 0, "aVertexPosition" );
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
                return;
            }
            this.renderer.programData[this.selectedShaderIndex].program = program;
            this.renderer.cacheLitShaderProgramLocations(this.selectedShaderIndex);
        }
        else {
            console.log("no renderer context! This is bad.");
        }
    };
    ShaderEditor.prototype.install = function () {
        var _this = this;
        var container = document.getElementById("shader-editor");
        this.selectedShaderIndex = 0;
        this.vertexShaderEditor.setValue(this.renderer.programData[0].vert, -1);
        this.fragmentShaderEditor.setValue(this.renderer.programData[0].frag, -1);
        this.vertexEditSessions = [];
        this.fragmentEditSessions = [];
        this.visibleShaders = []; // rebuild this list each time
        var _loop_1 = function () {
            if (isNaN(programName)) {
                // skip hidden shaders
                var index_1 = parseInt(SHADER_PROGRAM[programName]);
                if (this_1.hiddenShaders.indexOf(index_1) != -1)
                    return "continue";
                this_1.visibleShaders.push(index_1);
                var vertexSession_1 = ace.createEditSession(this_1.renderer.programData[index_1].vert, "ace/mode/glsl");
                vertexSession_1.on("change", function (e) {
                    _this.rebuildSelectedShader(vertexSession_1);
                });
                this_1.vertexEditSessions.push(vertexSession_1);
                var fragSession_1 = ace.createEditSession(this_1.renderer.programData[index_1].frag, "ace/mode/glsl");
                fragSession_1.on("change", function (e) {
                    _this.rebuildSelectedShader(fragSession_1);
                });
                this_1.fragmentEditSessions.push(fragSession_1);
                var li_1 = document.createElement("li");
                li_1.innerText = this_1.prettifyEnum(programName);
                li_1.setAttribute("class", "shader-entry");
                this_1.shaderList.appendChild(li_1);
                li_1.onclick = function () {
                    if (_this.selectedShader != li_1) {
                        _this.selectedShaderIndex = index_1;
                        _this.vertexShaderEditor.setSession(vertexSession_1);
                        _this.fragmentShaderEditor.setSession(fragSession_1);
                        _this.selectedShader.setAttribute("class", "shader-entry"); // deselect
                        _this.selectedShader = li_1;
                        li_1.setAttribute("class", "selected shader-entry");
                    }
                };
            }
        };
        var this_1 = this;
        for (var programName in SHADER_PROGRAM) {
            _loop_1();
        }
        this.selectedShader = this.shaderList.firstElementChild;
        this.selectedShader.setAttribute("class", "selected shader-entry");
        container.appendChild(this.shaderList);
        container.appendChild(this.shaderEditor);
    };
    ShaderEditor.prototype.prettifyEnum = function (input) {
        var output = input.replace(/_/g, " ");
        output = output.toLowerCase();
        output = output.replace(/\b\w/g, function (l) { return l.toUpperCase(); });
        return output;
    };
    return ShaderEditor;
}());
var SkyApp = /** @class */ (function () {
    function SkyApp(params, shaderRepo) {
        var _this = this;
        this.renderer = new Renderer(params.vp, shaderRepo);
        this.editor = new ShaderEditor(this.renderer);
        this.dbg = new Debugger(this.renderer);
        this.orbitCenter = params.orbitCenter;
        this.orbitDistance = params.orbitDistance;
        this.yaw = gml.fromDegrees(140);
        this.pitch = gml.fromDegrees(0);
        this.renderer.setCamera(this.camera);
        this.dirty = true;
        this.dragStart = new gml.Vec2(0, 0);
        this.lastMousePos = new gml.Vec2(0, 0);
        this.editor.hideShader(SHADER_PROGRAM.DEBUG);
        this.editor.hideShader(SHADER_PROGRAM.LAMBERT);
        this.editor.hideShader(SHADER_PROGRAM.OREN_NAYAR);
        this.editor.hideShader(SHADER_PROGRAM.BLINN_PHONG);
        this.editor.hideShader(SHADER_PROGRAM.COOK_TORRANCE);
        this.editor.hideShader(SHADER_PROGRAM.WATER_SCREENSPACE);
        this.editor.hideShader(SHADER_PROGRAM.CUBE_SH);
        this.editor.hideShader(SHADER_PROGRAM.NOISE_WRITER);
        this.editor.hideShader(SHADER_PROGRAM.VOLUME_VIEWER);
        this.editor.hideShader(SHADER_PROGRAM.RENDER_DEPTH_TEXTURE);
        {
            var baseAim = new gml.Vec4(0, 0, -1, 0);
            var rotY = gml.Mat4.rotateY(this.yaw);
            var rotRight = rotY.transform(gml.Vec4.right);
            var rotX = gml.Mat4.rotate(rotRight, this.pitch);
            var rotAim = rotX.transform(rotY.transform(baseAim)).normalized;
            var rotUp = rotRight.cross(rotAim);
            var rotPos = this.orbitCenter.add(rotAim.negate().multiply(this.orbitDistance));
            this.camera = new Camera(rotPos, rotAim, rotUp, rotRight);
        }
        var options = document.getElementsByTagName("select");
        var frameLimiterOption = null;
        for (var i = 0; i < options.length; i++) {
            if (options[i].id == 'frame-limiter')
                frameLimiterOption = options[i];
        }
        frameLimiterOption.onchange = changeFrameLimit;
        var cloudinessSlider = document.getElementById("cloud-slider");
        var cloudSpeedSlider = document.getElementById("wind-slider");
        var focalDistanceSlider = document.getElementById("focal-distance");
        cloudinessSlider.oninput = changeCloudiness;
        cloudSpeedSlider.oninput = changeCloudSpeed;
        cloudSpeedSlider.onchange = changeFinished;
        focalDistanceSlider.oninput = changeFocalDistance;
        var wireframeCheckbox = document.getElementById("water-wireframe");
        wireframeCheckbox.onchange = changeWireframe;
        var showFPSCheckbox = document.getElementById("debug-fps");
        showFPSCheckbox.onchange = changeShowFPS;
        this.FPSContainer = document.getElementById("fps-indicator");
        var playbackButton = document.getElementById("toggle-playback");
        playbackButton.onclick = togglePlayback;
        document.body.onmouseup = changeFinished;
        params.vp.addEventListener('mousedown', function (ev) {
            switch (ev.button) {
                case 0:// left
                    _this.dragStart.x = ev.clientX;
                    _this.dragStart.y = ev.clientY;
                    _this.lastMousePos.x = ev.clientX;
                    _this.lastMousePos.y = ev.clientY;
                    _this.dragging = true;
                    break;
                case 1:// middle
                    break;
                case 2:// right
                    break;
            }
            ev.preventDefault();
            return false;
        }, false);
        params.vp.addEventListener('mouseup', function (ev) {
            _this.dragging = false;
            ev.preventDefault();
            return false;
        }, false);
        var PAN_PIXEL_TO_RADIAN = 1 / 40;
        params.vp.addEventListener('mousemove', function (ev) {
            if (_this.dragging) {
                var deltaX = ev.clientX - _this.lastMousePos.x;
                var deltaY = ev.clientY - _this.lastMousePos.y;
                _this.lastMousePos.x = ev.clientX;
                _this.lastMousePos.y = ev.clientY;
                _this.yaw = _this.yaw.add(gml.fromRadians(-deltaX * PAN_PIXEL_TO_RADIAN).negate()).reduceToOneTurn();
                var newPitch = _this.pitch.add(gml.fromRadians(-deltaY * PAN_PIXEL_TO_RADIAN)).reduceToOneTurn();
                var deg = newPitch.toDegrees();
                if (deg > 90 && deg < 270) {
                    if (Math.abs(90 - deg) < 90) {
                        newPitch = gml.fromDegrees(90);
                    }
                    else {
                        newPitch = gml.fromDegrees(270);
                    }
                }
                _this.pitch = newPitch;
                _this.dirty = true;
                ev.preventDefault();
                return false;
            }
        }, false);
    }
    return SkyApp;
}());
var frameLimit = -1;
var stoptime = false;
var lastAdjusted = ""; // need this
function changeCloudiness(e) {
    scene.cloudiness = e.target.value / 100;
}
function changeCloudSpeed(e) {
    lastAdjusted = "cloudspeed";
    stoptime = true;
    scene.cloudSpeed = e.target.value / 30; // 1 to 3.33ish
}
function changeFocalDistance(e) {
    lastAdjusted = "focaldist";
    var f = e.target.value / 100;
    // fudge for our app: transform from 0 to 1 to 0 to 0.3
    app.camera.focalDistance = 0.3 * f;
}
function changeFinished(e) {
    if (lastAdjusted == "cloudspeed") {
        stoptime = false;
    }
    lastAdjusted = "";
}
function changeWireframe(e) {
    watermat.wireframe = e.target.checked;
}
function changeShowFPS(e) {
    if (e.target.checked) {
        app.FPSContainer.style.visibility = "visible";
    }
    else {
        app.FPSContainer.style.visibility = "hidden";
    }
}
function togglePlayback(e) {
    stoptime = !stoptime;
    if (stoptime) {
        e.target.value = '\u25B6';
    }
    else {
        e.target.value = '\u275A\u275A';
    }
}
function changeFrameLimit(e) {
    switch (e.target.value) {
        case "adaptive":
            frameLimit = -1;
            break;
        case "15":
            frameLimit = 15;
            break;
        case "30":
            frameLimit = 30;
            break;
        case "60":
            frameLimit = 60;
            break;
        case "120":
            frameLimit = 120;
            break;
        case "144":
            frameLimit = 144;
            break;
        case "custom":
            frameLimit = 240; // Haahaa
            break;
    }
}
var app = null;
var scene = null;
var noise = null;
var lastFrame = null;
var texturesDownloaded = 0;
var finishedDownloadingTexture = false;
var worley_data = null;
var sparse_data = null;
var perlin_data = null;
var watermat;
function updateAndDraw(t) {
    // request another refresh
    requestAnimationFrame(updateAndDraw);
    var dtInMillis = t - lastFrame;
    var dt = dtInMillis / 1000.0;
    var interval = 1000.0 / frameLimit;
    if (frameLimit != -1 && dtInMillis < interval) {
        return;
    }
    lastFrame = t;
    if (frameLimit != -1) {
        lastFrame -= (dtInMillis % interval);
    }
    if (!stoptime) {
        scene.time += dt;
    }
    if (app.dirty) {
        // rebuild camera
        var baseAim = new gml.Vec4(0, 0, -1, 0);
        var rotY = gml.Mat4.rotateY(app.yaw);
        var rotRight = rotY.transform(gml.Vec4.right);
        var rotX = gml.Mat4.rotate(rotRight, app.pitch);
        var rotAim = rotX.transform(rotY.transform(baseAim)).normalized;
        var rotUp = rotRight.cross(rotAim);
        var rotPos = app.orbitCenter.add(rotAim.negate().multiply(app.orbitDistance));
        app.camera = new Camera(rotPos, rotAim, rotUp, rotRight);
        app.renderer.setCamera(app.camera);
        app.renderer.update();
    }
    if ((!stoptime || app.dirty) && finishedDownloadingTexture) {
        app.renderer.render();
    }
    app.dirty = false;
    app.FPSContainer.innerHTML = "FPS: " + Math.round(1.0 / dt);
}
// download the two textures we care about, then build them, then inject into scene
function composeNoiseTextures(gl) {
    var texture = noise.composeFromPackedData(gl, { r: { data: perlin_data, size: 128 }, g: { data: worley_data, size: 64 }, b: { data: sparse_data, size: 64 } });
    scene.noiseVolume = texture;
}
function StartSky() {
    if (app == null) {
        var params = {
            vp: document.getElementById("big-viewport"),
            orbitCenter: new gml.Vec4(0, 5, 0, 1),
            orbitDistance: 0.001
        };
        var shaderRepo = new ShaderRepository(function (repo) {
            app = new SkyApp(params, repo);
            var gl = app.renderer.context;
            app.editor.install();
            app.dbg.install();
            noise = new Noise();
            // download two blob files
            var worley_req = new XMLHttpRequest();
            worley_req.addEventListener("load", function (evt) {
                texturesDownloaded++;
                finishedDownloadingTexture = texturesDownloaded == 2;
                worley_data = new Uint8Array(worley_req.response);
                if (finishedDownloadingTexture) {
                    composeNoiseTextures(gl);
                }
            });
            worley_req.open("GET", "worley.blob", true);
            worley_req.responseType = "arraybuffer";
            worley_req.send();
            var sparse_req = new XMLHttpRequest();
            sparse_req.addEventListener("load", function (evt) {
                sparse_data = new Uint8Array(sparse_req.response);
                texturesDownloaded++;
                finishedDownloadingTexture = texturesDownloaded == 2;
                if (finishedDownloadingTexture) {
                    composeNoiseTextures(gl);
                }
            });
            sparse_req.open("GET", "sparse_worley.blob", true);
            sparse_req.responseType = "arraybuffer";
            sparse_req.send();
            perlin_data = noise.perlin3TextureDataPacked(128);
            var emptyTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_3D, emptyTexture);
            // no mips, 1x1x1...
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
            gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, 1, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
            gl.bindTexture(gl.TEXTURE_3D, null);
            scene = new Scene(null, null, true, true, emptyTexture);
            Scene.setActiveScene(scene);
            watermat = new WaterMaterial(new gml.Vec4(1.0, 1.0, 1.0, 1), new gml.Vec4(1.0, 1.0, 1.0, 1), new gml.Vec4(1.0, 1.0, 1.0, 1), new gml.Vec4(1.0, 1.0, 1.0, 1), 1.53);
            // ocean
            scene.addRenderable(new InfinitePlane(12, 4, new gml.Vec4(0, 0, 0, 1), { x: gml.fromDegrees(0), y: gml.fromDegrees(0), z: gml.fromDegrees(0) }, { u: 6, v: 6 }, watermat));
            lastFrame = performance.now();
            var cloudinessSlider = document.getElementById("cloud-slider");
            var cloudSpeedSlider = document.getElementById("wind-slider");
            var focalDistanceSlider = document.getElementById("focal-distance");
            cloudinessSlider.value = (scene.cloudiness * 100).toString();
            cloudSpeedSlider.value = (scene.cloudSpeed * 30).toString();
            focalDistanceSlider.value = ((app.camera.focalDistance / 0.3) * 100).toString();
            updateAndDraw(performance.now());
            // screenspace ocean
            /*
            scene.addRenderable( new Quad( 1
                                             , new gml.Vec4( 0, 30, 0, 1 )
                                             , null
                                             , new WaterMaterial( new gml.Vec4( 1.0, 1.0, 1.0, 1 )
                                                                , new gml.Vec4( 1.0, 1.0, 1.0, 1 )
                                                                , new gml.Vec4( 1.0, 1.0, 1.0, 1 )
                                                                , new gml.Vec4( 1.0, 1.0, 1.0, 1 )
                                                                , 1.53
                                                                , true ) ) ); */
        });
    }
}
// Implementation heavily based on josephg's noisejs, which is based on Stefan Gustavson's implementation.
// Source:
//  https://github.com/josephg/noisejs/blob/master/perlin.js
function isPowerOfTwo(x) {
    return (x & (x - 1)) == 0;
}
var Noise = /** @class */ (function () {
    function Noise() {
        this.worleySeed = 0;
        this.grad3 = [new gml.Vec3(1, 1, 0), new gml.Vec3(-1, 1, 0), new gml.Vec3(1, -1, 0), new gml.Vec3(-1, -1, 0),
            new gml.Vec3(1, 0, 1), new gml.Vec3(-1, 0, 1), new gml.Vec3(1, 0, -1), new gml.Vec3(-1, 0, -1),
            new gml.Vec3(0, 1, 1), new gml.Vec3(0, -1, 1), new gml.Vec3(0, 1, -1), new gml.Vec3(0, -1, -1)];
        this.p = [151, 160, 137, 91, 90, 15,
            131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
            251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
            49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
        // "allocate" space
        this.perm = new Array(512);
        this.gradP = new Array(512);
        this.seed(0);
        this.seedWorley();
    }
    // josephg: This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.
    Noise.prototype.seed = function (seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }
        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }
        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = this.p[i] ^ (seed & 255);
            }
            else {
                v = this.p[i] ^ ((seed >> 8) & 255);
            }
            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
        }
    };
    // doesn't take a seed because I don't have a PRNG
    Noise.prototype.seedWorley = function () {
        this.worleyFeaturePoints = [];
        var numFP = 128;
        for (var i = 0; i < numFP; i++) {
            var featurePointX = Math.random();
            var featurePointY = Math.random();
            var featurePointZ = Math.random();
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY, featurePointZ));
            // for tiling in 3D space...
            // pretend each feature point also exists exactly one cube unit over (for each face, edge and corner)
            // this can probably be slightly optimized (IE: can probably cut this by 33%)
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX + 1, featurePointY, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX - 1, featurePointY, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY + 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY - 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY, featurePointZ + 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY, featurePointZ - 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX + 1, featurePointY + 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX - 1, featurePointY + 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX + 1, featurePointY - 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX - 1, featurePointY - 1, featurePointZ));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY + 1, featurePointZ + 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY - 1, featurePointZ + 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY + 1, featurePointZ - 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX, featurePointY - 1, featurePointZ - 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX + 1, featurePointY, featurePointZ + 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX - 1, featurePointY, featurePointZ + 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX + 1, featurePointY, featurePointZ - 1));
            this.worleyFeaturePoints.push(new gml.Vec3(featurePointX - 1, featurePointY, featurePointZ - 1));
        }
        this.worleyApproxMaxDist = 1.0 / 2.51; // 2.51 == cuberoot( 16 )
    };
    Noise.prototype.fade = function (t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    };
    Noise.prototype.lerp = function (a, b, t) {
        return (1 - t) * a + t * b;
    };
    Noise.prototype.fusionTexture = function (gl, size) {
        var rgb = [];
        var pt = new gml.Vec3(0, 0, 0);
        for (var z = 0; z < size; z++) {
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    pt.x = x / size;
                    pt.y = y / size;
                    pt.z = z / size;
                    var perlin = this.perlin3(x * 1.001, y * 1.001, z * 1.001, size - 1);
                    var worley = Math.max((this.worleyApproxMaxDist - this.worley3(pt)) / this.worleyApproxMaxDist, 0.0);
                    rgb.push(perlin * 255); // R
                    rgb.push(worley * 255); // G
                    rgb.push(0); // unused
                }
            }
        }
        var data = new Uint8Array(rgb);
        var noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);
        // no mips
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        gl.bindTexture(gl.TEXTURE_3D, null);
        return noiseTexture;
    };
    Noise.prototype.worley3Texture = function (gl, size) {
        var rgb = [];
        var pt = new gml.Vec3(0, 0, 0);
        for (var z = 0; z < size; z++) {
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    pt.x = x / size;
                    pt.y = y / size;
                    pt.z = z / size;
                    var n = Math.max((this.worleyApproxMaxDist - this.worley3(pt)) / this.worleyApproxMaxDist, 0.0);
                    rgb.push(n * 255); // R
                    rgb.push(n * 255); // G
                    rgb.push(n * 255); // B
                }
            }
        }
        var data = new Uint8Array(rgb);
        var noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);
        // no mips
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        gl.bindTexture(gl.TEXTURE_3D, null);
        return noiseTexture;
    };
    Noise.prototype.perlin3TextureDataPacked = function (size) {
        var rgb = [];
        for (var z = 0; z < size; z++) {
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var n = this.perlin3(x * 1.0005, y * 1.0005, z * 1.0005, size - 1);
                    rgb.push(n * 255); // R
                }
            }
        }
        return new Uint8Array(rgb);
    };
    Noise.prototype.perlin3Texture = function (gl, size) {
        var rgb = [];
        for (var z = 0; z < size; z++) {
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var n = this.perlin3(x * 1.0005, y * 1.0005, z * 1.0005, size - 1);
                    rgb.push(n * 255); // R
                    rgb.push(n * 255); // G
                    rgb.push(n * 255); // B
                }
            }
        }
        var data = new Uint8Array(rgb);
        var noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);
        // no mips
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        gl.bindTexture(gl.TEXTURE_3D, null);
        return noiseTexture;
    };
    Noise.prototype.perlin3 = function (x, y, z, period) {
        if (period === void 0) { period = 255; }
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        // Get relative xyz coordinates of point within that cell
        x = x - X;
        y = y - Y;
        z = z - Z;
        // Wrap the integer cells at specified period
        X = X & period;
        Y = Y & period;
        Z = Z & period;
        // Calculate noise contributions from each of the eight corners
        var n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z);
        var n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(x, y, z - 1);
        var n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(x, y - 1, z);
        var n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(x, y - 1, z - 1);
        var n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(x - 1, y, z);
        var n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(x - 1, y, z - 1);
        var n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(x - 1, y - 1, z);
        var n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);
        // Compute the fade curve value for x, y, z
        var u = this.fade(x);
        var v = this.fade(y);
        var w = this.fade(z);
        // Interpolate
        return this.lerp(this.lerp(this.lerp(n000, n100, u), this.lerp(n001, n101, u), w), this.lerp(this.lerp(n010, n110, u), this.lerp(n011, n111, u), w), v);
    };
    Noise.prototype.probLookup = function (value) {
        if (value < 393325350)
            return 1;
        if (value < 1022645910)
            return 2;
        if (value < 1861739990)
            return 3;
        if (value < 2700834071)
            return 4;
        if (value < 3372109335)
            return 5;
        if (value < 3819626178)
            return 6;
        if (value < 4075350088)
            return 7;
        if (value < 4203212043)
            return 8;
        return 9;
    };
    Noise.prototype.lcgRandom = function (lastValue) {
        return ((1103515245 * lastValue + 12345) % 0x100000000);
    };
    Noise.prototype.worley3 = function (pt, period) {
        if (period === void 0) { period = 255; }
        var closest = -1;
        var closestSq = Number.MAX_VALUE;
        for (var i = 0; i < this.worleyFeaturePoints.length; i++) {
            var distSq = gml.Vec3.distsq(pt, this.worleyFeaturePoints[i]);
            if (closestSq > distSq) {
                closestSq = distSq;
                closest = i;
            }
        }
        return gml.Vec3.distance(pt, this.worleyFeaturePoints[closest]);
        /*
        let nearest = this.worleyFeaturePointKDTree.findNearest( pt, Number.MAX_VALUE );
        return nearest;
         */
    };
    Noise.prototype.composeFromPackedData = function (gl, packed) {
        var unpacked = [];
        if (!isPowerOfTwo(packed.r.size) || !isPowerOfTwo(packed.g.size) || !isPowerOfTwo(packed.b.size))
            debugger;
        var size = Math.max(packed.r.size, packed.g.size, packed.b.size);
        var scale = { r: packed.r.size / size, g: packed.g.size / size, b: packed.b.size / size };
        for (var z = 0; z < size; z++) {
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var index = z * size * size + y * size + x;
                    var x_r = Math.floor(scale.r * x);
                    var y_r = Math.floor(scale.r * y);
                    var z_r = Math.floor(scale.r * z);
                    var size_r = scale.r * size;
                    var x_g = Math.floor(scale.g * x);
                    var y_g = Math.floor(scale.g * y);
                    var z_g = Math.floor(scale.g * z);
                    var size_g = scale.g * size;
                    var x_b = Math.floor(scale.b * x);
                    var y_b = Math.floor(scale.b * y);
                    var z_b = Math.floor(scale.b * z);
                    var size_b = scale.b * size;
                    var r_index = z_r * size_r * size_r + y_r * size_r + x_r;
                    var g_index = z_g * size_g * size_g + y_g * size_g + x_g;
                    var b_index = z_b * size_b * size_b + y_b * size_b + x_b;
                    unpacked.push(packed.r.data[r_index]);
                    unpacked.push(packed.g.data[g_index]);
                    unpacked.push(packed.b.data[b_index]);
                }
            }
        }
        var noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);
        // no mips
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(unpacked));
        gl.bindTexture(gl.TEXTURE_3D, null);
        return noiseTexture;
    };
    Noise.prototype.textureFromOfflinePackedData = function (gl, path, size, loadDoneCallback) {
        var _this = this;
        // download blob file
        var req = new XMLHttpRequest();
        // onload, create texture for use
        req.addEventListener("load", function (evt) {
            var texture = _this.textureFromPackedData(gl, new Uint8Array(req.response), size);
            loadDoneCallback(texture);
        });
        req.open("GET", path, true);
        req.responseType = "arraybuffer";
        req.send();
        // create an empty 1x1x1 texture for temporary use
        var emptyTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, emptyTexture);
        // no mips, 1x1x1...
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, 1, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        gl.bindTexture(gl.TEXTURE_3D, null);
        return emptyTexture;
    };
    Noise.prototype.textureFromPackedData = function (gl, data, size) {
        var unpacked = [];
        // unpack RGB
        for (var i = 0; i < data.length; i++) {
            unpacked.push(data[i]);
            unpacked.push(data[i]);
            unpacked.push(data[i]);
        }
        var noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);
        // no mips
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(unpacked));
        gl.bindTexture(gl.TEXTURE_3D, null);
        return noiseTexture;
    };
    return Noise;
}());
var Axis;
(function (Axis) {
    Axis[Axis["X"] = 0] = "X";
    Axis[Axis["Y"] = 1] = "Y";
    Axis[Axis["Z"] = 2] = "Z";
})(Axis || (Axis = {}));
// 3-dimensional KD-tree to speed up nearest neighbor lookup
// NOTE: buggy and slow for <1000 feature pts, just use linear scan
var KDTree = /** @class */ (function () {
    function KDTree(p, min, max, axis, first, second) {
        this.point = p;
        this.min = min;
        this.max = max;
        switch (axis) {
            case Axis.X:
                this.getAxisValue = KDTree.GetX;
                this.compareFunction = KDTree.CompareX;
                break;
            case Axis.Y:
                this.getAxisValue = KDTree.GetY;
                this.compareFunction = KDTree.CompareY;
                break;
            case Axis.Z:
                this.getAxisValue = KDTree.GetZ;
                this.compareFunction = KDTree.CompareZ;
                break;
        }
        this.first = first;
        this.second = second;
    }
    KDTree.CompareX = function (p1, p2) {
        return p1.x - p2.x;
    };
    KDTree.CompareY = function (p1, p2) {
        return p1.y - p2.y;
    };
    KDTree.CompareZ = function (p1, p2) {
        return p1.z - p2.z;
    };
    KDTree.GetX = function (p) {
        return p.x;
    };
    KDTree.GetY = function (p) {
        return p.y;
    };
    KDTree.GetZ = function (p) {
        return p.z;
    };
    KDTree.prototype.findNearest = function (target, bestDist) {
        var dist = gml.Vec3.distance(this.point, target);
        if (dist < bestDist)
            bestDist = dist;
        if (this.first == null && this.second == null) {
            return dist;
        }
        else {
            if (this.compareFunction(target, this.point) < 0) {
                var r = this.first.findNearest(target, bestDist);
                if (r < bestDist)
                    bestDist = r;
                if (this.second != null && this.second.min - this.getAxisValue(target) < bestDist) {
                    r = Math.min(r, this.second.findNearest(target, bestDist));
                }
                return r;
            }
            else if (this.second != null) {
                var r = this.second.findNearest(target, bestDist);
                if (r < bestDist)
                    bestDist = r;
                if (this.getAxisValue(target) - this.first.max < bestDist) {
                    r = Math.min(r, this.first.findNearest(target, bestDist));
                }
                return r;
            }
        }
    };
    return KDTree;
}());
function nextAxis(axis) {
    switch (axis) {
        case Axis.X: return Axis.Y;
        case Axis.Y: return Axis.Z;
        case Axis.Z: return Axis.X;
    }
}
function treeify(points, sortAxis) {
    if (points == null || points.length == 0)
        return null;
    if (points.length > 1) {
        points.sort(function (p1, p2) {
            switch (sortAxis) {
                case Axis.X:
                    return p1.x - p2.x;
                case Axis.Y:
                    return p1.y - p2.y;
                case Axis.Z:
                    return p1.z - p2.z;
            }
        });
    }
    var mid = Math.floor(points.length / 2);
    var min = 0;
    var max = 0;
    switch (sortAxis) {
        case Axis.X:
            min = points[0].x;
            max = points[points.length - 1].x;
            break;
        case Axis.Y:
            min = points[0].y;
            max = points[points.length - 1].y;
            break;
        case Axis.Z:
            min = points[0].z;
            max = points[points.length - 1].z;
            break;
    }
    return new KDTree(points[mid], min, max, sortAxis, treeify(points.slice(0, mid), nextAxis(sortAxis)), treeify(points.slice(mid + 1), nextAxis(sortAxis)));
}
/*
 * License from josephg/noisejs:
 *
 *  ISC License
 *
 *  Copyright (c) 2013, Joseph Gentle
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 *  OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
//# sourceMappingURL=app.js.map