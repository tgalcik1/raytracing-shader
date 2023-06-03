#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

const float INFINITY = 9999.99;
const vec3 BACKGROUND = vec3(0.5, 0.8, 1);
const int NUM_LIGHTS = 3;
const int NUM_SPHERES = 10;
const int MAX_BOUNCE = 20;

struct Ray{
    vec3 origin;
    vec3 dir;
};

struct Material{
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float specPow;
    float reflect;
};

struct Light{
    float intensity;
    vec3 pos;
    vec3 color;
};

struct Sphere{
    vec3 pos;
    float radius;
    Material mat;
};

struct Scene{
    Light lights[NUM_LIGHTS];
    Sphere spheres[NUM_SPHERES];
};

float intersectSphere(Ray ray, Sphere sphere){
    float a = dot(ray.dir, ray.dir);
    vec3 g = ray.origin - sphere.pos;
    float b = dot(ray.dir, g);
    float c = dot(g,g) - (sphere.radius * sphere.radius);
    
    float discriminant = b*b - a*c;
    if (discriminant < 0.0) return INFINITY;
    
    float dsq = sqrt(discriminant);
    float t = (-b - dsq) / a;    // first intersection test
    if (t > 0.001) return t;
    
    t = (-b + dsq) / a;
    if (t > 0.001) return t;
    
    return INFINITY;
}

bool probe(vec3 e, vec3 d, float dist, Scene scene){
    
    // For each sphere
    for (int i = 0; i < NUM_SPHERES; i++) {
        Ray ray;
        ray.origin = e;
        ray.dir = d;
        Sphere sphere = scene.spheres[i];
        float intersection = intersectSphere(ray, sphere);
        if (0.001 < intersection && intersection < dist) {
            return false;
        }
    }
    
    return true;
}

vec3 trace(Ray ray, Scene scene){
    vec3 color = vec3(0,0,0);    // starting color
    int bounces = 0;
    for (int depth = 0; depth < MAX_BOUNCE; depth++){
        bounces++;
        if (depth == MAX_BOUNCE) {
            return vec3(0);
        }

        // find index of closest sphere
        float t_star = INFINITY;
        int nearestSphere = -1;
        for (int i = 0; i < NUM_SPHERES; i++) {
            float t = intersectSphere(ray, scene.spheres[i]);

            if (t < t_star) {
                t_star = t;
                nearestSphere = i;
            }
        }

        if (nearestSphere == -1 && depth == 0){
            return BACKGROUND;
        }
        else if (nearestSphere == -1){
            return (BACKGROUND * color);
        }
        
        vec3 P;
        vec3 N;
        Sphere sphere;
        // for O in objects:
        for (int k = 0; k < NUM_SPHERES; k++){
            if (k == nearestSphere){
                sphere = scene.spheres[k];    
                float t = intersectSphere(ray,sphere);
                P = ray.origin + (ray.dir * t);
                N = normalize(P - sphere.pos);

                // check for intersection
                if (t != INFINITY){
                    // for L in lights:
                    for (int i = 0; i < NUM_LIGHTS; i++){
                        color += sphere.mat.ambient * scene.lights[i].color;    // ambient

                        vec3 L = normalize(scene.lights[i].pos - P);
                        float N_dot_L = dot(N,L);

                        if(N_dot_L >= 0.0 && probe(P, L, length(P - L), scene)){
                            // phong shading
                            float I_l = scene.lights[i].intensity;
                            float lamb_ref = max(0.0, N_dot_L);
                            color += sphere.mat.diffuse * I_l * lamb_ref;

                            // specular highlights
                            vec3 H = normalize(L - ray.dir);
                            float N_dot_H = dot(N, H);
                            if (N_dot_H > 0.0) {
                                vec3 spec = sphere.mat.specular * I_l * pow(N_dot_H, sphere.mat.specPow) * N_dot_H;
                                color += spec;
                            }
                        }
                    }
                }
            }
        }
        if (sphere.mat.reflect == 0.0){
            break;
        }
        ray.origin = P;
        ray.dir = ray.dir + 2.0*(dot(N, -ray.dir)*N) * sphere.mat.reflect;
    }
    return color/vec3(bounces);
}

void main() {
    // uv coords
    vec2 tc = gl_FragCoord.xy/u_resolution.xy;
    
    // scene setup
    Scene scene;
    scene.lights[0] = Light(1.0, vec3(-10, 10, -20), vec3(1,1,1));
    scene.lights[1] = Light(0.5, vec3(20, -30, 40), vec3(1,1,1));
    scene.spheres[0] = Sphere(vec3(sin(u_time) * 3.0 + 4.0,sin(u_time + 0.5) + 2.5, -5.0), 2.0, Material(vec3(0.25, 0, 0), vec3(1, 0, 0), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[1] = Sphere(vec3(sin(u_time + 0.5) * 3.0 + 5.5,sin(u_time + 0.25) + 3.5, -3.0), 2.0, Material(vec3(0.25, 0.125, 0), vec3(1, 0.5, 0), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[2] = Sphere(vec3(sin(u_time + 1.0) * 3.0 + 6.75,sin(u_time + 0.0) + 4.75, 0.0), 2.0, Material(vec3(0.25, 0.25, 0), vec3(1, 1, 0), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[3] = Sphere(vec3(sin(u_time + 1.5) * 3.0 + 8.0,sin(u_time - 0.25) + 6.0, 3.0), 2.0, Material(vec3(0.0, 0.25, 0), vec3(0, 1, 0), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[4] = Sphere(vec3(sin(u_time + 2.0) * 3.0 + 9.0,sin(u_time + -0.5) + 7.0, 5.0), 2.0, Material(vec3(0.0, 0.0, 0.25), vec3(0, 0, 1), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[5] = Sphere(vec3(sin(u_time + 2.5) * 3.0 + 10.0,sin(u_time + -0.75) + 8.0, 7.5), 2.0, Material(vec3(0.125, 0.0, 0.25), vec3(0.5, 0, 1), vec3(0.5, 0.5, 0.5), 40.0, 0.0));
    scene.spheres[6] = Sphere(vec3(8.5, 0, 20), 10.0, Material(vec3(0.125 * sin(u_time), -0.125 *sin(u_time), 0.125 *cos(u_time)), vec3(1.0 * sin(u_time), -1.0 *sin(u_time), 1.0 *cos(u_time)), vec3(0.8, 0.8, 0.8), 40.0, 0.0));
    scene.spheres[7] = Sphere(vec3(8.5, 20, 20), 10.0, Material(vec3(0.125, 0.125, 0.125), vec3(1, 1, 1), vec3(0.5, 0.5, 0.5), 40.0, 1.0));
    scene.spheres[8] = Sphere(vec3(0, sin(u_time)*4.0 + 6.0, 10), 2.0, Material(vec3(0.125, 0.125, 0.125), vec3(1, 1, 1), vec3(0.8, 0.8, 0.8), 40.0, 0.7));
    scene.spheres[9] = Sphere(vec3(13.5, -sin(u_time)*4.0 + 6.0, 10), 2.0, Material(vec3(0.125, 0.125, 0.125), vec3(1, 1, 1), vec3(0.8, 0.8, 0.8), 40.0, 0.7));
    
    // camera vars
    vec3 eyep = vec3(-sin(u_time) * 15.0, 0, -20);
    vec3 lookp = vec3(scene.spheres[4].pos.x, 10, 20);
    vec3 cameraDir = normalize(lookp - eyep);
    
    // ray starts at eye pos and goes through current uv coord
    Ray ray;
    ray.origin = eyep;
    vec3 rayDir = normalize(cameraDir);  // initial ray direction is the camera's forward direction
    vec3 right = normalize(cross(vec3(0, 1, 0), rayDir));  // calculate the camera's right direction
    vec3 up = normalize(cross(rayDir, right));  // calculate the camera's up direction

    // calculate the position on the image plane based on texture coordinates (tc)
    vec3 distanceToImagePlane = vec3(3);
    vec3 imagePlanePos = eyep + rayDir * distanceToImagePlane;
    vec3 offset = (2.0 * tc.x - 1.0) * right + (2.0 * tc.y - 1.0) * up;

    ray.dir = normalize(imagePlanePos + offset - eyep);
    
    // cast the ray (one ray per pixel for now)
    vec3 color = trace(ray, scene);

    // final color
    gl_FragColor = vec4(color, 1.0);
}