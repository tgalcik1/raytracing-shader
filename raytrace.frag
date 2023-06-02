#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

const float INFINITY = 9999.99;
const vec3 BACKGROUND = vec3(0.5, 0.8, 1);
const int NUM_LIGHTS = 3;
const int NUM_SPHERES = 3;

struct Ray{
    vec3 origin;
    vec3 dir;
};

struct Material{
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float specPow;
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
    if (t > 0.0001) return t;
    
    t = (-b + dsq) / a;
    if (t > 0.0001) return t;
    
    return INFINITY;
}

vec3 Trace(Ray ray, Scene scene){
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

    vec3 color = vec3(0,0,0);	// starting color
    
    if (nearestSphere == -1){
        return BACKGROUND;
    }
    // for O in objects:
    for (int k = 0; k < NUM_SPHERES; k++){
        Sphere sphere = scene.spheres[k];
        float t = intersectSphere(ray,sphere);
        // check for intersection
        if (t != INFINITY){
            // for L in lights:
            for (int i = 0; i < NUM_LIGHTS; i++){
                color += sphere.mat.ambient * scene.lights[i].color;	// ambient

                vec3 P = ray.origin + (ray.dir * t);
                vec3 N = normalize(P - sphere.pos);
                vec3 L = normalize(scene.lights[i].pos - P);

                float N_dot_L = dot(N,L);

                if(N_dot_L >= 0.0){
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
    
    return color;
}

void main() {
    // scene setup
    Scene scene;
    scene.lights[0] = Light(1.0, vec3(5.0, 50.0, -50.0), vec3(1,1,1));
    scene.spheres[0] = Sphere(vec3(5,sin(u_time) + 5.0, 0.0), 2.0, Material(vec3(0.025, 0.025, 0.025), vec3(1, 0, 0), vec3(0.5, 0.5, 0.5), 40.0));
    scene.spheres[1] = Sphere(vec3(2.5,sin(u_time + 0.5) + 2.5, 0), 2.0, Material(vec3(0.025, 0.025, 0.025), vec3(0, 1, 0), vec3(0.5, 0.5, 0.5), 40.0));
    scene.spheres[2] = Sphere(vec3(7.5,sin(u_time + -0.5) + 7.5, 0), 2.0, Material(vec3(0.025, 0.025, 0.025), vec3(0, 0, 1), vec3(0.5, 0.5, 0.5), 40.0));

    // uv coords
    vec2 tc = gl_FragCoord.xy/u_resolution.xy;
    
    // camera vars
    float fov = 0.25;
    vec3 eyep = vec3(0, 0, -40);
    vec3 lookp = vec3(0, sin(u_time)*0.5, 0);
    vec3 cameraDir = normalize(lookp - eyep);
    
    // ray starts at eye pos and goes through current uv coord
    Ray ray;
    ray.origin = eyep;
    ray.dir = normalize(cameraDir + vec3(tc,0) * fov);
    
    // cast the ray (one ray per pixel for now)
    vec3 color = Trace(ray, scene);

    // final color
    gl_FragColor = vec4(color, 1.0);
}